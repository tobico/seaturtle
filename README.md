# SeaTurtle

## Introduction

SeaTurtle is a pure-JavaScript MVC framework that sits atop jQuery, with a design heavily inspired by Cocoa and Ruby.

SeaTurtle is made available thanks to the generous release of source code by [ChessKids](http://chesskids.com.au) - check them out for great Chess Coaching services for schools and individuals in Australia.

## Features

 * OOP framework with support for inheritance, overriding methods, properties/attributes, destructors (via Objective-C-like reference counting)
 * MVC framework - models manage data, controllers manage models and views, and views manage DOM elements
 * Triggered events for objects (not just DOM elements)
 * Helper functions to create DOM elements without using innerHTML
 * Minimal global namespace pollution - includes "ST" utility class, and all built-in classes start with ST. Does *not* alter any native objects.
 * Piles of useful built in classes, including:
     * TableView - Table/Tree view
     * Array - wrapper over native Array with extra features
     * IndexedArray - Array that maintains indexing and linked list between contained objects
     * AutoField - Sophisticated autocompletion text field
     * Form - View that provides a form to edit arbitrary data
     * TabController - Tabbed management of View Controllers

