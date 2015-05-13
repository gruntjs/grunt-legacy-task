/*!
 * grunt-legacy-task <https://github.com/gruntjs/grunt-legacy-task>
 *
 * Copyright (c) 2015 "Cowboy" Ben Alman.
 * Licensed under the MIT license.
 */

'use strict';

/* deps:mocha */
var assert = require('assert');
var grunt = require('grunt');
var task = require('..');


describe('.task', function () {
  var actual, expected, key, value, cwd;

  describe('task.normalizeMultiTaskFiles', function () {
    beforeEach(function(done) {
      cwd = process.cwd();
      process.chdir('test/fixtures/files');
      done();
    });

    afterEach(function(done) {
      process.chdir(cwd);
      done();
    });

    it('normalize', function(done) {
      var flatten = grunt.util._.flatten;

      key = 'dist/built.js';
      value = 'src/*1.js';
      actual = task.normalizeMultiTaskFiles(value, key);
      expected = [
        {
          dest: 'dist/built.js',
          src: ['src/file1.js'],
          orig: {dest: key, src: [value]},
        },
      ];

      assert.deepEqual(actual, expected, 'should normalize destTarget: srcString.');
      key = 'dist/built.js';
      value = [['src/*1.js'], ['src/*2.js']];
      actual = task.normalizeMultiTaskFiles(value, key);
      expected = [
        {
          dest: 'dist/built.js',
          src: ['src/file1.js', 'src/file2.js'],
          orig: {dest: key, src: flatten(value)},
        },
      ];

      assert.deepEqual(actual, expected, 'should normalize destTarget: srcArray.');
      value = {
        src: ['src/*1.js', 'src/*2.js'],
        dest: 'dist/built.js'
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/built.js',
          src: ['src/file1.js', 'src/file2.js'],
          orig: value,
        },
      ];

      assert.deepEqual(actual, expected, 'should normalize target: {src: srcStuff, dest: destStuff}.');
      value = {
        files: {
          'dist/built-a.js': 'src/*1.js',
          'dist/built-b.js': ['src/*1.js', [['src/*2.js']]]
        }
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/built-a.js',
          src: ['src/file1.js'],
          orig: {dest: 'dist/built-a.js', src: [value.files['dist/built-a.js']]},
        },
        {
          dest: 'dist/built-b.js',
          src: ['src/file1.js', 'src/file2.js'],
          orig: {dest: 'dist/built-b.js', src: flatten(value.files['dist/built-b.js'])},
        },
      ];


      assert.deepEqual(actual, expected, 'should normalize target: {files: {destTarget: srcStuff, ...}}.');
      value = {
        files: [
          {'dist/built-a.js': 'src/*.whoops'},
          {'dist/built-b.js': [[['src/*1.js'], 'src/*2.js']]}
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/built-a.js',
          src: [],
          orig: {dest: Object.keys(value.files[0])[0], src: [value.files[0]['dist/built-a.js']]},
        },
        {
          dest: 'dist/built-b.js',
          src: ['src/file1.js', 'src/file2.js'],
          orig: {dest: Object.keys(value.files[1])[0], src: flatten(value.files[1]['dist/built-b.js'])},
        },
      ];

      assert.deepEqual(actual, expected, 'should normalize target: {files: [{destTarget: srcStuff}, ...]}.');
      value = {
        files: [
          {dest: 'dist/built-a.js', src: ['src/*2.js']},
          {dest: 'dist/built-b.js', src: ['src/*1.js', 'src/*2.js']}
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/built-a.js',
          src: ['src/file2.js'],
          orig: value.files[0],
        },
        {
          dest: 'dist/built-b.js',
          src: ['src/file1.js', 'src/file2.js'],
          orig: value.files[1],
        },
      ];

      assert.deepEqual(actual, expected, 'should normalize target: {files: [{src: srcStuff, dest: destStuff}, ...]}.');
      value = {
        files: [
          {dest: 'dist/built-a.js', src: ['src/*2.js'], foo: 123, bar: true},
          {dest: 'dist/built-b.js', src: ['src/*1.js', 'src/*2.js'], foo: 456, bar: null}
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/built-a.js',
          src: ['src/file2.js'],
          foo: 123,
          bar: true,
          orig: value.files[0],
        },
        {
          dest: 'dist/built-b.js',
          src: ['src/file1.js', 'src/file2.js'],
          foo: 456,
          bar: null,
          orig: value.files[1],
        },
      ];

      assert.deepEqual(actual, expected, 'should propagate extra properties.');
      done();
    });

    it('nonull', function(done) {
      value = {
        src: ['src/xxx*.js', 'src/yyy*.js'],
        dest: 'dist/built.js',
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: value.dest,
          src: [],
          orig: value,
        },
      ];

      assert.deepEqual(actual, expected, 'if nonull is not set, should not include non-matching patterns.');

      value = {
        src: ['src/xxx*.js', 'src/yyy*.js'],
        dest: 'dist/built.js',
        nonull: true,
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: value.dest,
          src: value.src,
          nonull: true,
          orig: value,
        },
      ];

      assert.deepEqual(actual, expected, 'if nonull is set, should include non-matching patterns.');
      done();
    });

    it('expandMapping', function(done) {
      value = {
        files: [
          {dest: 'dist/', src: ['src/file?.js'], expand: true},
          {dest: 'dist/', src: ['file?.js'], expand: true, cwd: 'src'},
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/src/file1.js', src: ['src/file1.js'],
          orig: value.files[0],
        },
        {
          dest: 'dist/src/file2.js', src: ['src/file2.js'],
          orig: value.files[0],
        },
        {
          dest: 'dist/file1.js', src: ['src/file1.js'],
          orig: value.files[1],
        },
        {
          dest: 'dist/file2.js', src: ['src/file2.js'],
          orig: value.files[1],
        },
      ];

      assert.deepEqual(actual, expected, 'expand to file mapping, removing cwd from destination paths.');

      value = {
        files: [
          {dest: 'dist/', src: ['src/file?.js'], expand: true, flatten: true},
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/file1.js', src: ['src/file1.js'],
          orig: value.files[0],
        },
        {
          dest: 'dist/file2.js', src: ['src/file2.js'],
          orig: value.files[0],
        },
      ];

      assert.deepEqual(actual, expected, 'expand to file mapping, flattening destination paths.');

      value = {
        files: [
          {
            dest: 'dist/',
            src: ['src/file?.js'],
            expand: true,
            rename: function(destBase, destPath) {
              return destBase + 'min/' + destPath.replace(/(\.js)$/, '.min$1');
            },
          },
        ]
      };
      actual = task.normalizeMultiTaskFiles(value, 'ignored');
      expected = [
        {
          dest: 'dist/min/src/file1.min.js', src: ['src/file1.js'],
          orig: value.files[0],
        },
        {
          dest: 'dist/min/src/file2.min.js', src: ['src/file2.js'],
          orig: value.files[0],
        },
      ];

      assert.deepEqual(actual, expected, 'expand to file mapping, renaming files.');
      done();
    });
  });
});
