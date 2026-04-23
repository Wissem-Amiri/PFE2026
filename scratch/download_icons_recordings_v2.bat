@echo off
set ASSET_URL=http://localhost:3845/assets
set TARGET_DIR=public\assets

curl -o "%TARGET_DIR%\search.svg" "%ASSET_URL%/e16ed281b456cd27b6310fba12c63f4213352f24.svg"
curl -o "%TARGET_DIR%\export.svg" "%ASSET_URL%/f49aab1d6721052afde15a5f2d37801537621320.svg"
curl -o "%TARGET_DIR%\filters.svg" "%ASSET_URL%/1b411a7695c87a1072b43047cd8d485f2721c89c.svg"
curl -o "%TARGET_DIR%\more-vertical.svg" "%ASSET_URL%/4b86cc25d8332cd86f8fcd425510ab00819bb56c.svg"
curl -o "%TARGET_DIR%\check.svg" "%ASSET_URL%/db7b15a870b8d5c66e76743f01c6ec737b9abe4c.svg"
curl -o "%TARGET_DIR%\upload-cloud.svg" "%ASSET_URL%/2a4d32899c10f17ca6ba3fb253386d2728ec3ba6.svg"
curl -o "%TARGET_DIR%\file-icon.svg" "%ASSET_URL%/269a3ec874135976d9599f7b7c6c4be671be7fac.svg"

echo Done downloading Recordings page icons.
