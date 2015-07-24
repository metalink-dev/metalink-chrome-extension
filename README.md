Install from Chrome Web Store
====

[Install this extension from the Chrome Web Store.](https://chrome.google.com/webstore/detail/jnpljlobbiggcdikagmiepniibjdinap) Source code is still available here.

[Metalinks](http://www.metalinker.org/) contain information (like mirrors & hashes) about downloads so that advanced features can be automated. Metalinks are frequently used for large downloads and files on mirror networks/CDNs. For example, Metalinks for openSUSE contain information about the OpenSUSE ISO disk image so the download process will be simpler. This information helps in variety of ways, such as checksumming (error detection & repair), mirror failover & download resuming, multi-sourced downloads, mirror priorities, p2p integration, & so on. This extension adds Metalink support to Chrome, and we hope for [native support in Chrome](http://code.google.com/p/chromium/issues/detail?id=1751) soon as well.

Why are Metalinks used?
====

Flaky internet connections and large files can lead to errors in the file, which usually means the whole file needs to be re-downloaded.

  * Metalinks can contain error repair information for fixing corrupted downloads. This helps in downloading large files like Linux distributions, software, videos, and games.
  * for downloading files available on a CDN or mirror network, so you can failover to another server if the current one you're using becomes unavailable.
  * webmail can use metalinks for "Download All Attachments" instead of putting all files in a .ZIP archive.
  * for downloading a whole album & creating a directory structure instead of putting already compressed files in an archive.
  * so sites publish mirror/CDN information enabling caches to recognize more hits properly (duplicate content that has already been downloaded).

Where are Metalinks used?
===

  * Many large ISOs for open source operating systems: [Ubuntu ISOs](http://releases.ubuntu.com/releases/oneiric/) along with [Wubi](http://www.ubuntu.com/download/ubuntu/windows-installer) their ISO downloader, [openSUSE](http://download.opensuse.org/distribution/12.1/iso/), Fedora ISOs, etc.
  * [KDE](http://dot.kde.org/2012/03/26/kde-enhances-mirroring-network), Xfce, XBMC, Free Software Foundation, and sugar labs.
  * [LibreOffice](http://download.documentfoundation.org/libreoffice/stable/3.5.2/win/x86/), [OpenOffice.org](http://openoffice.mirrorbrain.org/stable/3.3.0/).
  * [Game downloads: Eve Online](https://forums.eveonline.com/default.aspx?g=posts&m=51440 ).
  * all yum based system updaters (Red Hat/Fedora/CentOS/etc) and [Appupdater](http://www.nabber.org/projects/appupdater/) on Windows.

What other applications support Metalinks?
===

Over 50 applications support Metalinks, mostly download managers, browsers, p2p, & FTP apps.
Some of the most full featured are:

 * [aria2](http://aria2.sourceforge.net/): cross platform, command line, p2p
 * [curl](https://github.com/bagder/curl): cross platform, command line
 * [DownThemAll!](http://www.downthemall.net/): Firefox Addon
 * [wget](https://github.com/ilimugur/GSoC-Project): cross platform, command line
 * [GetRight](http://www.getright.com/): Windows
 * [metalink-checker](http://metalinks.svn.sourceforge.net/viewvc/metalinks/checker/metalink.py?view=markup): python
 * KGet: part of KDE
 * Free Download Manager: Windows
 * Speed Download: OS X
