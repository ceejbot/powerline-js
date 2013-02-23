/*global describe:true, it:true, before:true, after:true */

var
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should()
	;

var
	child = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	powerline = require('../powerline')
	;

function execute(args, callback)
{
	child.exec('./powerline.js' + args, function(err, stdout, stderr)
	{
		if (err)
			throw(err);

		callback(stderr, stdout);
	});
}

describe('powerline.js', function()
{
	describe('#constructor options', function()
	{
		it('is constructed with reasonable defaults', function()
		{
			var p = new powerline.Powerline();
			p.should.have.property('options');
			p.options.should.be.an('object');
			p.options.shell.should.equal('zsh');
			p.options.error.should.equal(false);
			p.options.mode.should.equal('patched');
			p.options.depth.should.equal(5);
			p.options.showRepo.should.equal(true);
			p.options.showPath.should.equal(true);
			p.options.cwdOnly.should.equal(false);
		});

		it('throws when passed an unknown shell', function()
		{
			var badOptions = function()
			{
				var p = new Powerline({ shell: 'tcsh'});
			};

			badOptions.should.throw();
		});

		it('obeys the mode option', function()
		{
			var p = new powerline.Powerline({mode: 'compatible'});
			p.options.mode.should.equal('compatible');
			p.separator.should.equal('\u25b6');
			p.separator_thin.should.equal('\u276f');

		});

		it('obeys the repo-only option', function()
		{

		});

		it('obeys the no-repo option', function()
		{

		});
	});

	describe('#draw', function()
	{
		it('returns a string with color escape sequences', function()
		{

		});

	});

	describe('#working directory', function()
	{
		var deepPath = '/this/is/a/deep/path/certainly/ohyes';

		it('obeys the depth option', function()
		{
			var p = new powerline.Powerline({depth: 6});
			p.cwd = path.normalize(process.cwd() + deepPath);
			p.addCWDSegment();
			p.segments.length.should.equal(7);
			p.segments[0].content.should.equal(' ~ ');
			p.segments[2].content.should.equal(' … ');
			p.segments[6].content.should.equal(' ohyes ');
		});

		it('handles very shallow depths gracefully', function()
		{
			var p = new powerline.Powerline({depth: 1});
			p.cwd = path.normalize(process.cwd() + deepPath);
			p.addCWDSegment();
			p.segments.length.should.equal(1);
			p.segments[0].content.should.equal(' ohyes ');
		});

		it('obeys the cwd-only option', function()
		{
			var p = new powerline.Powerline({cwdOnly: true});
			p.addCWDSegment();
			p.segments.length.should.equal(1);
			p.segments[0].content.should.equal(' powerline-js ');
		});

	});

	describe('#git', function()
	{
		it('displays the git repo branch', function(done)
		{
			var p = new powerline.Powerline();
			p.addGitSegment(function()
			{
				done();
			});
		});

		it('shows upstream changes', function()
		{

		});

		it('shows unpushed changes', function()
		{

		});
	});

	describe('#svn', function()
	{

	});

	describe('#hg', function()
	{
		// feature unimplemented
	});
});
