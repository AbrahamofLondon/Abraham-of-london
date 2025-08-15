
PS C:\Users\UserPC> $EXT='*.ts','*.tsx','*.md','*.mdx','*.js','*.jsx','*.json'
PS C:\Users\UserPC>
PS C:\Users\UserPC> $repls = @(
>>   # collapse both single and double ".element.svg" variants to the real icon
>>   @{ rx = '/assets/images/contact(?:\.element\.svg){1,2}'; rep = '/assets/images/social/phone.svg' },
>>   # old default blog cover -> canonical
>>   @{ rx = '/assets/images/blog/default-blog-cover\.jpg';   rep = '/assets/images/default-book.jpg' }
>> )
PS C:\Users\UserPC>
PS C:\Users\UserPC> Get-ChildItem -Recurse -File -Include $EXT |
>>   Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\' } |
>>   ForEach-Object {
>>     $p = $_.FullName
>>     $t = Get-Content -Raw -LiteralPath $p
>>     foreach ($m in $repls) { $t = $t -replace $m.rx, $m.rep }
>>     [IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
>> }
PS C:\Users\UserPC> $all = Get-ChildItem -Recurse -File -Include $EXT |
>>   Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\' } |
>>   Select-String -Pattern '/assets/images/[A-Za-z0-9_\-\/\.]+' -AllMatches |
>>   ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
PS C:\Users\UserPC>
PS C:\Users\UserPC> $canonical = @(
>>   '/assets/images/abraham-of-london-banner.webp',
>>   '/assets/images/profile-portrait.webp',
>>   '/assets/images/logo/abraham-of-london-logo.svg',
>>   '/assets/images/writing-desk.webp',
>>   '/assets/images/default-book.jpg',
>>   '/assets/images/alomarada-ltd.webp',
>>   '/assets/images/endureluxe-ltd.webp',
>>   '/assets/images/innovatehub.svg',
>>   '/assets/images/social/og-image.jpg',
>>   '/assets/images/social/twitter-image.webp',
>>   '/assets/images/social/facebook.svg',
>>   '/assets/images/social/instagram.svg',
>>   '/assets/images/social/linkedin.svg',
>>   '/assets/images/social/twitter.svg',
>>   '/assets/images/social/whatsapp.svg',
>>   '/assets/images/social/email.svg',
>>   '/assets/images/social/phone.svg',
>>   '/assets/images/blog/fathering-principles.jpg',
>>   '/assets/images/blog/fathering-without-fear-teaser.jpg',
>>   '/assets/images/blog/leadership-begins-at-home.jpg',
>>   '/assets/images/blog/principles-for-my-son.jpg',
>>   '/assets/images/blog/reclaiming-the-narrative.jpg',
>>   '/assets/images/blog/the-brotherhood-code.jpg',
>>   '/assets/images/blog/when-the-system-breaks-you.jpg',
>>   '/assets/images/books/fatherhood-cover.webp',
>>   '/assets/images/books/fathering-without-fear.jpg'
>> )
PS C:\Users\UserPC>
PS C:\Users\UserPC> "--- Non-canonical references ---"
--- Non-canonical references ---
PS C:\Users\UserPC> $all | Where-Object { $canonical -notcontains $_ }
PS C:\Users\UserPC> Test-Path .\public\assets\images\social\phone.svg
False
PS C:\Users\UserPC> Test-Path .\public\assets\images\default-book.jpg
False
PS C:\Users\UserPC>