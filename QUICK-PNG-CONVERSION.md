# PNG 转换快速指南

## 🚀 最快方法（推荐在线工具）

### 步骤 1: 访问在线转换器
打开：https://cloudconvert.com/svg-to-png

### 步骤 2: 上传 SVG 文件
- 点击 "选择文件"
- 导航到：`D:\AppGallery\codex\aibudda\public\og-image.svg`
- 选择文件并上传

### 步骤 3: 设置转换参数
- **输出格式:** PNG
- **宽度:** 1200
- **高度:** 630
- **背景:** 透明（如果有选项）

### 步骤 4: 下载并重命名
- 下载转换后的 PNG 文件
- 重命名为 `og-image.png`
- 移动到 `D:\AppGallery\codex\aibudda\public\` 目录

### 步骤 5: 验证
```cmd
cd D:\AppGallery\codex\aibudda\public
dir og-image.png
```

## 🔧 本地转换（需要安装 ImageMagick）

### 安装 ImageMagick

1. 下载：https://imagemagick.org/script/download.php
2. 安装时勾选：
   - ✅ "Install legacy utilities (e.g. convert)"
   - ✅ "Add application directory to your system path"
3. 运行：
   ```cmd
   generate-og-image.bat
   ```

### 手动转换命令

**标准版本 (1200x630):**
```cmd
magick convert public\og-image.svg -background none -resize 1200x630 public\og-image.png
```

**高清版本 (2400x1260):**
```cmd
magick convert public\og-image.svg -background none -resize 2400x1260 public\og-image@2x.png
```

## 📊 转换后检查

### 验证文件尺寸
```cmd
magick identify public\og-image.png
```

预期输出：
```
public\og-image.png PNG 1200x630 1200x630+0+0 8-bit sRGB 200KB ...
```

### 验证文件大小
```cmd
dir public\og-image*.png
```

理想大小：
- `og-image.png`: 50KB - 200KB
- `og-image@2x.png`: 100KB - 400KB

## 🎯 转换完成后

### 1. 更新元数据（如果使用 PNG）

在 `app/layout.tsx` 中：
```typescript
openGraph: {
  images: [{
    url: "/og-image.png",  // 改为 .png
    width: 1200,
    height: 630,
  }],
},
twitter: {
  images: ["/og-image.png"],  // 改为 .png
}
```

### 2. 测试转换结果
```bash
# 重启开发服务器
export PATH="/c/Program Files/nodejs:$PATH" && npm run dev

# 运行测试脚本
./test-og-metadata.sh
```

### 3. 验证图片可访问
```bash
curl -I http://localhost:3000/og-image.png
```

## 💡 建议

### 何时使用 PNG？
- ✅ 某些平台不支持 SVG
- ✅ 需要 PNG 用于某些社交媒体工具
- ✅ 想要更好的浏览器兼容性

### 何时保留 SVG？
- ✅ SVG 格式已经工作良好
- ✅ 文件更小（4.6KB vs 50-200KB）
- ✅ 矢量质量，任何尺寸都清晰
- ✅ 大部分现代平台都支持

### 最佳实践
- **保留两种格式** - 同时提供 SVG 和 PNG
- **默认使用 SVG** - 文件更小，性能更好
- **提供 PNG 备选** - 确保最大兼容性

## 🌐 在线工具对比

| 工具 | 速度 | 质量 | 限制 | 推荐度 |
|------|------|------|------|--------|
| CloudConvert | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 25次/天 | ⭐⭐⭐⭐⭐ |
| Convertio | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 10次/天 | ⭐⭐⭐⭐ |
| Online-Convert | ⭐⭐⭐ | ⭐⭐⭐ | 文件大小限制 | ⭐⭐⭐ |

## 📋 快速检查清单

转换完成后：
- [ ] PNG 文件存在于 `public/` 目录
- [ ] 文件尺寸正确 (1200x630)
- [ ] 文件大小合理 (50-200KB)
- [ ] 开发服务器已重启
- [ ] 元数据测试通过
- [ ] 在浏览器中访问 `http://localhost:3000/og-image.png`

---

**提示:** 如果 SVG 已经工作良好，你也可以保持使用 SVG 格式。PNG 主要用于增强兼容性。
