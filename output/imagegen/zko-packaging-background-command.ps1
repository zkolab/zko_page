$CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$ImageGen = Join-Path $CodexHome 'skills/.system/imagegen/scripts/image_gen.py'

python $ImageGen generate `
  --model gpt-image-2 `
  --prompt-file 'output/imagegen/zko-packaging-background-prompt.txt' `
  --size 2400x1440 `
  --quality high `
  --out 'output/imagegen/zko-packaging-background.png'
