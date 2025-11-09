export const ok = (res, data = {}, message = 'OK') =>
  res.status(200).json({ success: true, message, data });

export const created = (res, data = {}, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const badRequest = (res, message = 'Bad Request') =>
  res.status(400).json({ success: false, message });

export const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

export const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, message });

export const notFound = (res, message = 'Not Found') =>
  res.status(404).json({ success: false, message });
