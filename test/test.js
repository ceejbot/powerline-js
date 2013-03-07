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
	describe('#parseOptions', function()
	{
		it('parses an empty options array', function()
		{
			var opts = powerline.parseOptions();
			opts.should.be.an('object');
			Object.keys(opts).length.should.equal(0);
		});

		it('parses a typical array', function()
		{
			var opts = powerline.parseOptions(['--shell', 'bash', '--depth', '3', '2']);
			Object.keys(opts).length.should.equal(3);
			opts.shell.should.equal('bash');
			opts.depth.should.equal(3);
			opts.error.should.equal(true);
		});

	});

	describe('#constructor', function()
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

		it('generates a prompt with the given options', function(done)
		{
			var p = new powerline.Powerline();
			p.cwd = '~/projects/powerline-js';
			p.buildPrompt(function()
			{
				p.segments.length.should.equal(5);
				p.segments[0].content.should.equal(' ~ ');
				p.segments[3].content.indexOf(' master').should.equal(0);
				done();
			});
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

		it('obeys the repo-only option', function(done)
		{
			var opts = powerline.parseOptions(['--repo-only']);
			var p = new powerline.Powerline(opts);
			p.cwd = '~/projects/powerline-js';
			p.buildPrompt(function()
			{
				p.segments.length.should.equal(2);
				p.segments[0].content.indexOf(' master').should.equal(0);
				p.segments[1].content.indexOf('$').should.equal(3);
				done();
			});
		});

		it('obeys the no-repo option', function(done)
		{
			var opts = powerline.parseOptions(['--no-repo']);
			var p = new powerline.Powerline(opts);
			p.cwd = '~/projects/powerline-js';
			p.buildPrompt(function()
			{
				p.segments.length.should.equal(4);
				p.segments[3].content.indexOf('$').should.equal(3);
				done();
			});
		});
	});

	describe('#draw', function()
	{
		it('returns a string with color escape sequences TBD', function(done)
		{
			var p = new powerline.Powerline();
			p.buildPrompt(function()
			{
				var result = p.draw();
				result.should.be.a('string');
				done();
			});
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
				p.segments.length.should.equal(1);
				p.segments[0].content.indexOf(' master').should.equal(0);
				done();
			});
		});

		it('displays the presence of untracked files', function(done)
		{
			child.exec('touch foobar.txt', function(err, stdout, stderr)
			{
				var p = new powerline.Powerline();
				p.addGitSegment(function()
				{
					p.segments.length.should.equal(1);
					p.segments[0].content.indexOf('+').should.be.above(7);
					fs.unlinkSync('foobar.txt');
					done();
				});
			});
		});

		it('displays the repo with a red background if files are modified', function(done)
		{
			child.exec('echo "blat blat" > README.md', function(err, stdout, stderr)
			{
				var p = new powerline.Powerline();
				p.addGitSegment(function()
				{
					p.segments.length.should.equal(1);
					p.segments[0].fg.should.equal(15);
					p.segments[0].bg.should.equal(161);
					done();
				});
			});
		});

		it('displays the repo with a green background if files are unmodified', function(done)
		{
			child.exec('git checkout -- README.md', function(err, stdout, stderr)
			{
				var p = new powerline.Powerline();
				p.addGitSegment(function()
				{
					p.segments.length.should.equal(1);
					p.segments[0].fg.should.equal(0);
					p.segments[0].bg.should.equal(148);
					done();
				});
			});
		});

		it('shows upstream changes TBD', function()
		{

		});

		it('shows unpushed changes TBD', function()
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
