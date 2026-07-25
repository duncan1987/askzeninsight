# SVG to PNG Conversion Instructions

## 快速开始

### 方法 1: 使用生成的脚本（推荐）

安装 ImageMagick 后，运行：
```cmd
generate-og-image.bat
```

### 方法 2: 手动命令

#### Windows (CMD)
```cmd
cd D:\AppGallery\codex\aibudda\public
magick convert og-image.svg -background none -resize 1200x630 og-image.png
magick convert og-image.svg -background none -resize 2400x1260 og-image@2x.png
```

#### Windows (PowerShell)
```powershell
cd D:\AppGallery\codex\aibudda\public
magick convert og-image.svg -background none -resize 1200x630 og-image.png
magick convert og-image.svg -background none -resize 2400x1260 og-image@2x.png
```

#### macOS/Linux
```bash
cd public
convert og-image.svg -background none -resize 1200x630 og-image.png
convert og-image.svg -background none -resize 2400x1260 og-image@2x.png
```

## 参数说明

- `-background none` - 保持透明背景
- `-resize 1200x630` - 调整为标准 OG 尺寸
- `-resize 2400x1260` - 创建高清版本（@2x）

## 验证转换

检查转换结果：
```cmd
# 查看文件信息
magick identify og-image.png

# 查看文件大小
dir og-image*.png
```

预期结果：
- og-image.png: 1200x630, 约 50-200KB
- og-image@2x.png: 2400x1260, 约 100-400KB

## 优化 PNG（可选）

如果文件太大，可以优化：

```cmd
# 使用 optipng（如果已安装）
optipng -o7 og-image.png

# 使用 pngquant（如果已安装）
pngquant --quality=80-90 og-image.png --output og-image-optimized.png
```

## 故障排除

### 问题: "convert is not recognized"
解决: ImageMagick 未正确安装或未添加到 PATH

### 问题: "Unable to open file"
解决: 确保在正确的目录中运行命令

### 问题: 转换后的图片质量差
解决: 尝试不使用 `-resize` 参数，让 ImageMagick 使用原始分辨率

## 在线转换替代方案

如果安装 ImageMagick 有困难，使用在线工具：

1. **CloudConvert**: https://cloudconvert.com/svg-to-png
2. **Convertio**: https://convertio.co/zh/svg-png/
3. **Online-Convert**: https://online-convert.com/svg-png

设置参数：
- 输出格式: PNG
- 尺寸: 1200x630
- 背景: 透明
- 质量: 高

转换完成后，将文件重命名为 `og-image.png` 并放入 `public/` 目录。
