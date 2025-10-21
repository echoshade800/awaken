require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'screen-time-module'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '15.0'
  s.source         = { git: '' }
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.requires_arc   = true

  s.dependency 'React-Core'

  s.frameworks = 'FamilyControls', 'DeviceActivity', 'ManagedSettings'
end
