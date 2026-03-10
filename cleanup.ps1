$path = 'C:\Users\y4917\OneDrive\Desktop\OLD RICH\views\user\userProfile.ejs'
$content = Get-Content $path
$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -like '*<%# START_CLEANUP %>*') {
        $startLine = $i
    }
    if ($content[$i] -like '*</script>*' -and $startLine -ne -1) {
        $endLine = $i
        break
    }
}

if ($startLine -ne -1 -and $endLine -ne -1) {
    $newContent = $content[0..$startLine] + $content[($endLine + 1)..($content.Length - 1)]
    $newContent | Set-Content $path
}
