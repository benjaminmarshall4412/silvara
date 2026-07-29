import "server-only";

import EasyPost from "@easypost/api";

import type { AdminOrder } from "@/lib/admin-orders-types";

type FromAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  company?: string;
};

export function isShippingLabelConfigured(): boolean {
  return Boolean(
    process.env.EASYPOST_API_KEY?.trim() &&
      process.env.EASYPOST_FROM_STREET?.trim() &&
      process.env.EASYPOST_FROM_CITY?.trim() &&
      process.env.EASYPOST_FROM_STATE?.trim() &&
      process.env.EASYPOST_FROM_ZIP?.trim(),
  );
}

function getFromAddress(): FromAddress | null {
  if (!isShippingLabelConfigured()) return null;
  return {
    name: process.env.EASYPOST_FROM_NAME?.trim() || "SILVARA",
    company: process.env.EASYPOST_FROM_COMPANY?.trim() || "SILVARA",
    street1: process.env.EASYPOST_FROM_STREET!.trim(),
    street2: process.env.EASYPOST_FROM_STREET2?.trim() || undefined,
    city: process.env.EASYPOST_FROM_CITY!.trim(),
    state: process.env.EASYPOST_FROM_STATE!.trim().toUpperCase(),
    zip: process.env.EASYPOST_FROM_ZIP!.trim(),
    country: "US",
    phone: process.env.EASYPOST_FROM_PHONE?.trim() || undefined,
    email: process.env.EASYPOST_FROM_EMAIL?.trim() || undefined,
  };
}

function getClient(): InstanceType<typeof EasyPost> {
  const key = process.env.EASYPOST_API_KEY?.trim();
  if (!key) throw new Error("Missing EASYPOST_API_KEY");
  return new EasyPost(key);
}

export type CreateShippingLabelResult = {
  trackingNumber: string | null;
  postage: number | null;
  service: string | null;
  carrier: string | null;
  pdfBase64: string;
  labelUrl: string | null;
};

/**
 * Buy cheapest USPS rate via EasyPost and return a 4×6 PDF label.
 */
export async function createUsps4x6Label(
  order: AdminOrder,
): Promise<CreateShippingLabelResult> {
  const from = getFromAddress();
  if (!from) {
    throw new Error(
      "EasyPost not configured. Set EASYPOST_API_KEY and EASYPOST_FROM_STREET/CITY/STATE/ZIP.",
    );
  }

  const addr = order.shippingAddress ?? order.billingAddress;
  if (!addr?.line1 || !addr.city || !addr.state || !addr.postalCode) {
    throw new Error("Order is missing a complete shipping address");
  }
  const country = (addr.country || "US").toUpperCase();
  if (country !== "US" && country !== "USA") {
    throw new Error("Domestic USPS labels only support US addresses");
  }

  const weightOz = Number(process.env.EASYPOST_PARCEL_WEIGHT_OZ) || 8;
  const length = Number(process.env.EASYPOST_PARCEL_LENGTH_IN) || 9;
  const width = Number(process.env.EASYPOST_PARCEL_WIDTH_IN) || 6;
  const height = Number(process.env.EASYPOST_PARCEL_HEIGHT_IN) || 1;

  const client = getClient();
  const itemNote =
    order.lines.length > 0
      ? order.lines
          .map((l) => `${l.quantity}x ${l.name} ${l.sockColorLabel}`)
          .join("; ")
          .slice(0, 100)
      : order.id;

  const shipment = await client.Shipment.create({
    to_address: {
      name: order.shippingName || order.customerName || "Customer",
      street1: addr.line1,
      street2: addr.line2 || undefined,
      city: addr.city,
      state: addr.state.toUpperCase(),
      zip: addr.postalCode,
      country: "US",
      phone: order.customerPhone || undefined,
      email: order.customerEmail || undefined,
    },
    from_address: from,
    parcel: {
      length,
      width,
      height,
      weight: weightOz,
    },
    options: {
      label_format: "PDF",
      label_size: "4x6",
      print_custom_1: itemNote,
    },
  });

  const rate = shipment.lowestRate(["USPS"]);
  if (!rate) {
    throw new Error("No USPS rates returned for this address/parcel");
  }

  const bought = await client.Shipment.buy(shipment.id, rate);
  const labelUrl =
    bought.postage_label?.label_pdf_url ||
    bought.postage_label?.label_url ||
    null;
  if (!labelUrl) {
    throw new Error("EasyPost bought shipment but returned no label URL");
  }

  const labelRes = await fetch(labelUrl);
  if (!labelRes.ok) {
    throw new Error(`Failed to download label PDF (${labelRes.status})`);
  }
  const pdfBase64 = Buffer.from(await labelRes.arrayBuffer()).toString("base64");
  const postageRaw = rate.rate != null ? Number(rate.rate) : null;

  return {
    trackingNumber: bought.tracking_code ?? null,
    postage: postageRaw != null && Number.isFinite(postageRaw) ? postageRaw : null,
    service: rate.service ?? null,
    carrier: rate.carrier ?? "USPS",
    pdfBase64,
    labelUrl,
  };
}
