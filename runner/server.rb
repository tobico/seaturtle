#!/usr/bin/env ruby
require 'rubygems'
require 'sinatra'
require 'slim'
require 'v8'
require 'coffee-script'
require 'runner/required_files'

module Sinatra
  module Templates
    def slim(template, options={}, locals={})
      render :slim, template, options, locals
    end 
  end
end

Slim::Engine.set_default_options :pretty => true

def compile source, target
  begin
    mtime = File.mtime source
        
    return File.read target if File.exists?(target) && File.mtime(target) == mtime
    
    dir = target.sub /\/[^\/]+$/, ''
    Dir.mkdir dir unless File.exists? dir
    File.open target, 'w' do |f|
      f.write CoffeeScript.compile(File.read source)
    end
    File.utime mtime, mtime, target
    
    File.read target
  rescue CoffeeScript::CompilationError => e
    message = if e.message.match /^SyntaxError: (.*) on line (\d+)\D*$/
      "#{source}:#{$2}".ljust(40) + " #{$1}"
    elsif e.message.match /^Parse error on line (\d+): (.*)$/
      "#{source}:#{$1}".ljust(40) + " #{$2}"
    else
      "#{source} - #{e.message}"
    end
    puts "\e[31m#{message}\e[0m"
    html = "<pre class=\"failed\">#{message}</pre>"
    "$(function(){$(document.body).prepend(#{html.to_json});});"
  end
end

get %r{^/lib/(.+)\.js$} do |file|
  compile "lib/#{file}.coffee", "compiled/#{file}.js"
end

get %r{^/spec/(.+)\.js$} do |file|
  compile "spec/#{file}.coffee", "compiled/#{file}.js"
end

get "/" do
  requirements = RequiredFiles.new
  requirements.paths = ['spec', 'lib']
  requirements.add 'ST/Spec'
  Dir['spec/**/*.spec.coffee'].each do |file|
    requirements.add $1 if file.match /^spec\/(.*).coffee$/
  end
  @scripts = requirements.sorted_files
  p @scripts
  
  slim :index
end