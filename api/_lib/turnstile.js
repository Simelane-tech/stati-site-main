async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail safe: if not configured, don't block real users — but log it loudly.
    console.error('TURNSTILE_SECRET_KEY is not set — skipping verification.');
    return true;
  }
  if (!token) return false;

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteIp) params.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification request failed:', err);
    return false;
  }
}

module.exports = { verifyTurnstile };