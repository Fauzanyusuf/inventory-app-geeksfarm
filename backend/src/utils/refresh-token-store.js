const revoked = new Set();

export async function revokeRefreshToken(token) {
  if (!token) return;
  revoked.add(token);
}

export async function isRefreshTokenRevoked(token) {
  return revoked.has(token);
}

export async function clearRevokedStore() {
  revoked.clear();
}

export default { revokeRefreshToken, isRefreshTokenRevoked, clearRevokedStore };
