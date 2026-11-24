// Who is signed in, and who may open what.
const { getMember } = require('../services/accounts');

const wantsJson = (req) => req.originalUrl.startsWith('/api/');

// Every request: put the signed-in member into req.member (or null).
// A member suspended in the meantime loses the session on the next click.
function attachMember(req, res, next) {
  req.member = null;
  const id = req.session.memberId;
  if (id) {
    const member = getMember(id);
    if (member && !member.blocked_at) req.member = member;
    else delete req.session.memberId;
  }
  res.locals.member = req.member; // for the EJS templates
  next();
}

function mustBeSignedIn(req, res, next) {
  if (req.member) return next();
  if (wantsJson(req)) return res.status(401).json({ error: 'You need to sign in first.' });
  res.redirect(`/admin/sign-in?back=${encodeURIComponent(req.originalUrl)}`);
}

function mustBeAdmin(req, res, next) {
  if (!req.member) return mustBeSignedIn(req, res, next);
  if (req.member.role === 'admin') return next();
  if (wantsJson(req)) return res.status(403).json({ error: 'This needs administrator rights.' });
  res.status(403).render('message', {
    title: 'Administrators only',
    text: 'Your account cannot open this page. It is meant for marketplace administrators.',
  });
}

module.exports = { attachMember, mustBeSignedIn, mustBeAdmin };
