require "rubygems"
require "bundler/setup"
require "coffee-script"

Dir.mkdir 'compiled' unless File.exists? 'compiled'
raise "Can't create compile directory" unless File.directory? 'compiled'

# Compile coffee scripts
files = Dir['lib/**/*.coffee']
longest_name = files.map(&:length).max
for file in Dir['lib/**/*.coffee']
  begin
    CoffeeScript.compile File.read(file)
  rescue CoffeeScript::CompilationError => e
    if e.message.match /^SyntaxError: (.*) on line (\d+)\D*$/
      puts "\e[31m#{file}:#{$2}".ljust(longest_name + 6) + " #{$1}\e[0m"
    elsif e.message.match /^Parse error on line (\d+): (.*)$/
      puts "\e[31m#{file}:#{$1}".ljust(longest_name + 6) + " #{$2}\e[0m"
    else
      puts "#{file} - #{e.message}"
    end
  end
end