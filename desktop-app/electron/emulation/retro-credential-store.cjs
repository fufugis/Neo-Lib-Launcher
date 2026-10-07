// Deliberately separate from library/settings, backups and renderer snapshots.
function createRetroCredentialStore({ fsp, path, root, safeStorage }) {
  let cached; let writes = Promise.resolve();
  const file = () => path.join(root(), 'credentials.bin');
  async function read() {
    if (cached) return cached;
    try {
      if (!safeStorage?.isEncryptionAvailable()) return {};
      const encrypted = await fsp.readFile(file());
      if (encrypted.length > 65536) return {};
      const value = JSON.parse(safeStorage.decryptString(encrypted));
      cached = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { cached = {}; }
    return cached;
  }
  function save(provider, value) {
    const operation = writes.then(async () => {
      if (!safeStorage?.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable.');
      const current = await read(); const next = { ...current };
      if (value === null) delete next[provider]; else next[provider] = value;
      const encrypted = safeStorage.encryptString(JSON.stringify(next));
      await fsp.mkdir(root(), { recursive: true });
      const temporary = `${file()}.tmp`; await fsp.writeFile(temporary, encrypted, { mode: 0o600 });
      await fsp.rename(temporary, file()); cached = next;
      return true;
    });
    writes = operation.catch(() => {}); return operation;
  }
  return { read, save, available: () => safeStorage?.isEncryptionAvailable() === true };
}
module.exports = { createRetroCredentialStore };
