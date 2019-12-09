import path from 'path';

export function html(req, res, next) {
  let name = 'Anonymous';
  let url = 'https://doenet.cloud/';

  if (req.jwt && req.jwt.user && !req.jwt.user.guest) {
    name = req.jwt.user.firstName;
    url = `https://doenet.cloud/users/${req.jwt.user._id}`;
  }

  res.set('Content-Type', 'text/html');
  res.send(`<html><head><script src="iframe.js"></script><base target="_parent"/></head><body style="overflow: hidden; margin: 0; font-family: sans-serif; height: 14pt; font-size: 12pt;"><a style="white-space: nowrap; width: 64pt; overflow: hidden; text-overflow: ellipsis; display: block;" href="${url}">${name}</a></body></html>`);
}

export function js(req, res, next) {
  return res.sendFile(path.join(__dirname, '../iframe', 'iframe.js'));
}
