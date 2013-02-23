I was using [milkbikis](https://github.com/milkbikis)'s excellent [powerline-style shell prompt](https://github.com/milkbikis/powerline-shell) when I decided that I wanted more options. Then I wanted a version in javascript instead of python so I could add those options myself in my current programming environment of choice. Then I started rewriting it. Then I observed that it was faster in javascript than in python, probably because node.js starts up really quickly.

This is the tragic result: a powerline-style shell prompt generator for node.

![the powerline prompt in action](http://i.imgur.com/e7GpyGV.png)

The last segment of the prompt shows the git branch active, if you're in a git repo. Repos with uncommitted modifications are shown in red. If there are untracked files, a + is added. If you have unpushed changes, there's an ⇡ with the change count. If the upstream repo has changes you've fetched but not yet merged, there's a ⇣ with the count of how many you're behind.

## Installation

`npm install powerline` should install `powerline` in your node path. Or clone the repo & symlink `powerline.js` to some location in your path.

Then go to the original most excellent project page and [find a patched font you like](https://github.com/Lokaltog/vim-powerline/wiki/Patched-fonts).

## Usage

Use it as you would the original. E.g, for bash:

```sh
function _update_ps1() {
   export PS1="$(~/bin/powerline.js $? --shell bash --depth 4)"
}
export PROMPT_COMMAND="_update_ps1"
```

For zsh:

```sh
function powerline_precmd()
{
   export PS1="$(~/bin/powerline.js $?)"
}
precmd_functions=(powerline_precmd)
```

## Options

`--shell [zsh|bash]`  
: which shell to emit color escapes for; defaults to `'zsh'`

`--cwd-only`  
: use only the current working directory in the prompt; defaults to `false`

`--mode [patched|compatible]`  
: which font mode to expect; defaults to `'patched'`

`--depth *N*`  
: how many segments of the current working directory to show; defaults to 5

`--no-repo`  
: do not attempt to show extra source repository information for the current directory; defaults to `false`

`--repo-only`  
: generate *only* a source repository segment; defaults to `false`

Any further arguments are presumed to be `$?` aka the error returned by the previous shell command.

No mercurial support yet and the svn support isn't good, but then, you're using git anyway. Note that I default to zsh because that's how I roll, but the original defaults to bash.

## TODO

* An option to reverse the prompt direction, for use in zsh right prompts.
* Mercurial support.
* Optional timestamp segment.

## License

MIT.
