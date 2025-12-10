Pod::Spec.new do |s|
  s.name           = 'ExpoARKit'
  s.version        = '1.0.0'
  s.summary        = 'ARKit integration for Expo'
  s.description    = 'Native ARKit module for Expo applications'
  s.author         = ''
  s.homepage       = 'https://github.com/Kevinparra535/creativedev.ar-tech'
  s.platform       = :ios, '17.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
end
