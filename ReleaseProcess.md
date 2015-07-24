# Introduction #

Process for new releases.

# Details #

  * **Update version number** in manifest.json.
  * **Pack extension.**
  * **Update updates.xml**: Download, edit version in local, delete remote, upload new file. **always mark as Deprecated** so it doesn't show up in the download list.
  * **Check file size.** It should be around 50k. Make sure ".svn" directory is not included.
  * **Test autoupdate within Chrome.** Make sure appid is correct.
  * **Upload new CRX file to Google Code.** It seems like the release file name must always be the same and not include version number or the appid changes.
  * **Deprecate old version CRX file** so it doesn't show up in the download list.