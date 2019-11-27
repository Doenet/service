import path from 'path';

export function html( req, res, next ) {
  return res.sendFile(path.join(__dirname, '../iframe', 'iframe.html'));
}

export function js( req, res, next ) {
  return res.sendFile(path.join(__dirname, '../iframe', 'iframe.js'));
}
