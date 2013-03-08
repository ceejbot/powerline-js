#!/usr/bin/env node

// Powerline-style prompt in js instead of python.
// 100% inspired by https://github.com/milkbikis/powerline-bash

var
	child = require('child_process');

var COLOR =
{
	PATH_BG: 237,  // dark grey
	PATH_FG: 250,  // light grey
	CWD_FG: 254, // nearly-white grey
	SEPARATOR_FG: 244,

	REPO_CLEAN_BG: 148, // a light green color
	REPO_CLEAN_FG: 0,  // black
	REPO_DIRTY_BG: 161, // pink/red
	REPO_DIRTY_FG: 15, // white

	CMD_PASSED_BG: 236,
	CMD_PASSED_FG: 15,
	CMD_FAILED_BG: 161,
	CMD_FAILED_FG: 15,

	SVN_CHANGES_BG: 148,
	SVN_CHANGES_FG: 22, // dark green

	VIRTUAL_ENV_BG: 35, // a mid-tone green
	VIRTUAL_ENV_FG: 22
};

var SYMBOLS =
{
	'compatible':
	{
		separator: '\u25b6',
		separator_thin: '\u276f'
	},
	'patched':
	{
		separator: '\u2B80',
		separator_thin: '\u2B81'
	}
};


//---------------------------------------------------

var COLOR_TEMPLATES =
{
	'bash': function(s) { return '\\[\\e' + s + '\\]'; },
	'zsh': function(s) { return '%{' + s + '%}'; }
};

function Shell(which)
{
	if (Object.keys(COLOR_TEMPLATES).indexOf(which) === -1)
		throw new Error('shell ' + which + ' not supported');

	this.name = which;
	this.colorTemplate = COLOR_TEMPLATES[which];
	this.reset = this.colorTemplate('[0m');
}

Shell.prototype.color = function(prefix, code)
{
	return this.colorTemplate('[' + prefix + ';5;' + code + 'm');
};

Shell.prototype.fgcolor = function(code)
{
	return this.color('38', code);
};

Shell.prototype.bgcolor = function(code)
{
	return this.color('48', code);
};

//---------------------------------------------------

function Powerline(options)
{
	options = options || {};
	this.options = {};
	this.options.shell = options.shell || 'zsh';
	this.options.mode = options.mode || 'patched';
	this.options.error = options.hasOwnProperty('error') ? options.error : false;
	this.options.depth = options.depth || 5;
	this.options.showRepo = options.hasOwnProperty('showRepo') ? options.showRepo : true;
	this.options.showPath = options.hasOwnProperty('showPath') ? options.showPath : true;
	this.options.cwdOnly = options.cwdOnly || false;

	this.shell = new Shell(this.options.shell);

	this.separator = SYMBOLS[this.options.mode].separator;
	this.separator_thin = SYMBOLS[this.options.mode].separator_thin;

	this.segments = [];
	this.cwd = process.env.PWD || process.cwd();
}

Powerline.prototype.buildPrompt = function(callback)
{
	var self = this;

	this.addVirtualEnvSegment();
	this.addCWDSegment();
	this.addRepoSegment(function()
	{
		self.addRootIndicator();
		callback();
	});
};

Powerline.prototype.draw = function(code)
{
	var result = [];
	var shifted = this.segments.slice(1);
	shifted.push(null);

	for (var i = 0; i < this.segments.length; i++)
	{
		var item = this.segments[i];
		var next = shifted[i];

		result.push(item.draw(next));
	}

	result.push(this.shell.reset);
	return result.join('');
};

Powerline.prototype.addCWDSegment = function()
{
	if (!this.options.showPath)
		return;

	var home = process.env['HOME'];
	var cwd = this.cwd;

	if (cwd.indexOf(home) === 0)
		cwd = cwd.replace(home, '~');

	if (cwd[0] === '/')
		cwd = cwd.substring(1, cwd.length);

	var names = cwd.split('/');
	if (!this.options.cwdOnly && (this.options.depth > 1))
	{
		if (names.length > this.options.depth)
		{
			var diff = names.length - this.options.depth;
			var start = this.options.depth > 4 ? 2 : 1;
			names.splice(start, diff, '\u2026');
		}

		for (var i = 0; i < names.length - 1; i++)
		{
			this.segments.push(new Segment(
				this,
				' ' + names[i] + ' ',
				COLOR.PATH_FG,
				COLOR.PATH_BG,
				this.separator_thin,
				COLOR.SEPARATOR_FG
			));
		}
	}

	this.segments.push(new Segment(
		this,
		' ' + names[names.length - 1] + ' ',
		COLOR.CWD_FG,
		COLOR.PATH_BG
	));
};

Powerline.prototype.addRootIndicator = function()
{
	var bg = this.options.error ? COLOR.CMD_FAILED_BG : COLOR.CMD_PASSED_BG;
	var fg = this.options.error ? COLOR.CMD_FAILED_FG : COLOR.CMD_PASSED_FG;
	this.segments.push(new Segment(this, ' \\$ ', fg, bg));
};

Powerline.prototype.addVirtualEnvSegment = function()
{
	var env = process.env['VIRTUAL_ENV'];
	if (!env)
		return;

	var path = require('path');

	this.segments.push(new Segment(this,
		' ' + path.basename(env) + ' ',
		COLOR.VIRTUAL_ENV_FG,
		COLOR.VIRTUAL_ENV_BG
	));
};

Powerline.prototype.addRepoSegment = function(callback)
{
	if (!this.options.showRepo)
		return callback();

	var self = this;

	self.addGitSegment(function(found)
	{
		if (found) return callback();
		self.addSVNSegment(function(found)
		{
			if (found) return callback();
			self.addHGSegment(callback);
		});
	});
};

Powerline.prototype.addGitSegment = function(callback)
{
	var self = this;

	var hasPending = false;
	var hasUntracked = false;
	var branch;

	child.exec('git status -sb --ignore-submodules', function(err, stdout, stderr)
	{
		if (err || !stdout)
			return callback(false);

		var lines = stdout.trim().split('\n');

		var status = lines.shift().trim();
		var matches = status.match(/^## ([^\.\s]*)/);
		if (matches)
			branch = matches[1];

		matches = status.match(/ahead\s+(\d+)/);
		if (matches)
			branch += ' \u21E1' + matches[1];

		matches = status.match(/behind\s+(\d+)/);
		if (matches)
			branch += ' \u21E3' + matches[1];

		for (var i = 0; i < lines.length; i++)
		{
			if ((lines[i][1] === 'M') || (lines[i][0] === 'M'))
				hasPending = true;
			else if (lines[i][0] === '?')
				hasUntracked = true;

			if (hasUntracked && hasPending)
				break;
		}

		if (hasUntracked)
			branch += ' +';

		var fg = hasPending ? COLOR.REPO_DIRTY_FG : COLOR.REPO_CLEAN_FG;
		var bg = hasPending ? COLOR.REPO_DIRTY_BG : COLOR.REPO_CLEAN_BG;

		self.segments.push(new Segment(self, ' ' + branch, fg, bg));
		callback(true);
	});
};

Powerline.prototype.addSVNSegment = function(callback)
{
	var self = this;
	var fs = require('fs');

	if (!fs.existsSync('.svn'))
		return callback(false);

	child.exec('svn status | grep -c "^[ACDIMRX\\!\\~]"', function(err, stdout, stderr)
	{
		// TODO that grep command always exits with an error; fix
		if (!stdout || !stdout.length)
			return callback(true);

		var changes = parseInt(stdout.trim(), 10);
		if (changes > 0)
		{
			self.segments.push(new Segment(self,
				' ' + changes + ' ',
				COLOR.SVN_CHANGES_FG,
				COLOR.SVN_CHANGES_BG
			));
		}
		callback(true);
	});
};

Powerline.prototype.addHGSegment = function(callback)
{
	// TODO
	callback(false);
};

//---------------------------------------------------

function Segment(powerline, content, fg, bg, separator, separatorFG)
{
	this.shell = powerline.shell;
	this.content = content;
	this.fg = fg;
	this.bg = bg;
	this.separator = separator || powerline.separator;
	this.separatorFG = separatorFG || bg;
}

Segment.prototype.draw = function(nextSegment)
{
	var sep, pieces;

	if (nextSegment)
		sep = this.shell.bgcolor(nextSegment.bg);
	else
		sep = this.shell.reset;

	pieces = [
		this.shell.fgcolor(this.fg),
		this.shell.bgcolor(this.bg),
		this.content,
		sep,
		this.shell.fgcolor(this.separatorFG),
		this.separator
	];

	return pieces.join('');
};

//---------------------------------------------------

function parseOptions(args)
{
	args = args || [];
	var options = {};

	while (args.length)
	{
		var opt = args.shift();
		switch (opt)
		{
			case '--cwd-only':
				options.showRepo = false;
				options.showPath = true;
				options.cwdOnly = true;
				break;

			case '--shell':
				options.shell = args.shift();
				break;

			case '--mode':
				options.mode = args.shift();
				break;

			case '--depth':
				options.depth = parseInt(args.shift(), 10);
				break;

			case '--repo-only':
				options.showRepo = true;
				options.showPath = false;
				break;

			case '--no-repo':
				options.showRepo = false;
				break;

			default:
				options.error = (opt !== '0');
		}
	}

	return options;
}

if (require.main === module)
{
	var options = parseOptions(process.argv.slice(2));
	var p = new Powerline(options);
	p.buildPrompt(function()
	{
		process.stdout.write(p.draw());
	});
}

exports.Powerline = Powerline;
exports.Segment = Segment;
exports.parseOptions = parseOptions;

