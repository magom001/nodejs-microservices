const semver = require('semver');

class ServiceRegistry {
  constructor(log) {
    this.log = log;
    this.services = new Map();
    this.timeout = 30;
  }

  static getKey(name, version, ip, port) {
    return name + version + ip + port;
  }

  get(name, version) {
    this.cleanup();
    const candidates = Array.from(this.services.values()).filter(
      (service) =>
        service.name === name && semver.satisfies(service.version, version),
    );

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  register(name, version, ip, port) {
    this.cleanup();
    const key = ServiceRegistry.getKey(name, version, ip, port);

    if (!this.services.has(key)) {
      this.services.set(key, {
        timestamp: Math.floor(Date.now() / 1000),
        ip,
        port,
        name,
        version,
      });

      this.log.debug(
        `Added service ${name}, version ${version} at ${ip}:${port}`,
      );

      return key;
    }

    const value = this.services.get(key);
    value.timestamp = Math.floor(Date.now() / 1000);
    this.services.set(key, value);

    this.log.debug(
      `Updated service ${name}, version ${version} at ${ip}:${port}`,
    );

    return key;
  }

  unregister(name, version, ip, port) {
    const key = ServiceRegistry.getKey(name, version, ip, port);

    this.services.delete(key);

    this.log.debug(
      `Unregistered service ${name}, version ${version} at ${ip}:${port}`,
    );

    return key;
  }

  cleanup() {
    const now = Math.floor(Date.now() / 1000);
    Array.from(this.services.keys()).forEach((key) => {
      const service = this.services.get(key);

      if (service.timestamp + this.timeout < now) {
        this.services.delete(key);
        this.log.debug(`Removed service ${key}`);
      }
    });
  }
}

module.exports = ServiceRegistry;
