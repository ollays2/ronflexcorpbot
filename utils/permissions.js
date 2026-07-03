function isAuthorized(interaction) {
  const allowedIds = (process.env.ALLOWED_ROLE_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (allowedIds.length === 0) return true; // pas configuré = pas de restriction (à activer !)

  const memberRoles = interaction.member?.roles?.cache;
  if (!memberRoles) return false;

  return allowedIds.some(id => memberRoles.has(id));
}

module.exports = { isAuthorized };
