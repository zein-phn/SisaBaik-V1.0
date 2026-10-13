import { HttpError } from "../lib/api.js";

export function tanganiError(error, req, res, next) {
  if (res.headersSent) return next(error);
  
  let status = 500;
  let code = "INTERNAL SERVER ERROR";
  let message = "Terjadi kesalahan pada server.";
  
  if (error instanceof HttpError) {
    ({ status, code, message } = error);
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID JSON";
    message = "JSON tidak valid.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD TOO LARGE";
    message = "Payload melebihi 20 KB.";
  } else if (["23503", "23001"].includes(error.code)) {
    status = 409;
    code = "REFERENCE CONFLICT";
    message = "Relasi tidak valid atau data masih dipakai riwayat pesanan.";
  } else if (
    ["23514", "23502", "22003", "22007", "22008", "22001"].includes(error.code)
  ) {
    status = 400;
    code = "DATA CONSTRAINT";
    message = "Data melanggar aturan database.";
  } else if (error.code === "23505") {
    status = 409;
    code = "DATA CONFLICT";
    message = "Data unik sudah digunakan.";
  } else if (["55P03", "40P01", "40001", "57014"].includes(error.code)) {
    status = 409;
    code = "TRANSACTION BUSY";
    message = "Transaksi belum dapat selesai. Periksa state sebelum mengulang.";
  } else if (
    ["ECONNREFUSED", "ECONNRESET", "57P01", "53300"].includes(error.code)
  ) {
    status = 503;
    code = "DATABASE UNAVAILABLE";
    message = "Database belum tersedia.";
  }
  
  if (status >= 500) console.error("Server error:", error.code ?? error.name);
  
  return res
    .status(status)
    .json({ success: false, error: { code, message } });
}