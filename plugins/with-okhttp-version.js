const { createRunOncePlugin, withAppBuildGradle } = require('@expo/config-plugins')

const OKHTTP_DEPENDENCY = 'implementation("com.squareup.okhttp3:okhttp:4.12.1")'

function withOkHttpVersion(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes(OKHTTP_DEPENDENCY)) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        'dependencies {',
        `dependencies {
    // Keep Android network clients protected from the compromised eMudhra CAs.
    // This upgrades older transitive OkHttp dependencies to version 4.12.1.
    ${OKHTTP_DEPENDENCY}`,
      )
    }

    return modConfig
  })
}

module.exports = createRunOncePlugin(withOkHttpVersion, 'with-okhttp-version', '1.0.0')
