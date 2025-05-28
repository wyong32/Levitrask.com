#!/usr/bin/env node

/**
 * 构建分析脚本
 * 分析构建产物，验证 PageSpeed 优化效果
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildAnalyzer {
  constructor() {
    this.distPath = path.join(__dirname, '../dist');
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      chunkAnalysis: {},
      recommendations: []
    };
  }

  // 分析构建产物
  async analyze() {
    console.log('🔍 开始分析构建产物...\n');

    try {
      // 检查 dist 目录是否存在
      if (!fs.existsSync(this.distPath)) {
        console.log('❌ dist 目录不存在，请先运行 npm run build');
        return;
      }

      this.analyzeBundleSize();
      this.analyzeChunks();
      this.analyzeAssets();
      this.generateRecommendations();
      this.printReport();

    } catch (error) {
      console.error('❌ 分析过程中出现错误:', error.message);
    }
  }

  // 分析包大小
  analyzeBundleSize() {
    console.log('📦 分析包大小...');

    const jsFiles = this.getFilesByExtension('.js');
    const cssFiles = this.getFilesByExtension('.css');
    const imageFiles = this.getFilesByExtension(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

    this.results.bundleSize = {
      javascript: this.calculateTotalSize(jsFiles),
      css: this.calculateTotalSize(cssFiles),
      images: this.calculateTotalSize(imageFiles),
      total: this.calculateTotalSize([...jsFiles, ...cssFiles, ...imageFiles])
    };

    console.log(`  JavaScript: ${this.formatSize(this.results.bundleSize.javascript)}`);
    console.log(`  CSS: ${this.formatSize(this.results.bundleSize.css)}`);
    console.log(`  Images: ${this.formatSize(this.results.bundleSize.images)}`);
    console.log(`  Total: ${this.formatSize(this.results.bundleSize.total)}\n`);
  }

  // 分析代码块
  analyzeChunks() {
    console.log('🧩 分析代码块...');

    const jsFiles = this.getFilesByExtension('.js');
    const chunks = {};

    jsFiles.forEach(file => {
      const fileName = path.basename(file);
      const size = fs.statSync(file).size;
      
      // 识别不同类型的块
      let chunkType = 'other';
      if (fileName.includes('vendor')) chunkType = 'vendor';
      else if (fileName.includes('index')) chunkType = 'main';
      else if (fileName.includes('chunk')) chunkType = 'async';

      if (!chunks[chunkType]) chunks[chunkType] = [];
      chunks[chunkType].push({ name: fileName, size });
    });

    this.results.chunkAnalysis = chunks;

    Object.entries(chunks).forEach(([type, files]) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      console.log(`  ${type}: ${files.length} 个文件, ${this.formatSize(totalSize)}`);
      
      // 显示大文件
      const largeFiles = files.filter(f => f.size > 100000); // > 100KB
      if (largeFiles.length > 0) {
        console.log(`    大文件 (>100KB):`);
        largeFiles.forEach(f => {
          console.log(`      - ${f.name}: ${this.formatSize(f.size)}`);
        });
      }
    });
    console.log();
  }

  // 分析静态资源
  analyzeAssets() {
    console.log('🖼️ 分析静态资源...');

    const imageFiles = this.getFilesByExtension(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
    const largeImages = imageFiles
      .map(file => ({
        name: path.basename(file),
        size: fs.statSync(file).size,
        path: file
      }))
      .filter(img => img.size > 50000) // > 50KB
      .sort((a, b) => b.size - a.size);

    if (largeImages.length > 0) {
      console.log('  大图片文件 (>50KB):');
      largeImages.forEach(img => {
        console.log(`    - ${img.name}: ${this.formatSize(img.size)}`);
      });
    } else {
      console.log('  ✅ 没有发现过大的图片文件');
    }
    console.log();
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = [];

    // JavaScript 大小检查
    if (this.results.bundleSize.javascript > 500000) { // > 500KB
      recommendations.push('JavaScript 包过大，考虑进一步代码分割');
    }

    // CSS 大小检查
    if (this.results.bundleSize.css > 100000) { // > 100KB
      recommendations.push('CSS 文件较大，考虑移除未使用的样式');
    }

    // 检查是否有 vendor 块
    if (!this.results.chunkAnalysis.vendor) {
      recommendations.push('建议将第三方库分离到 vendor 块');
    }

    // 检查异步块
    if (!this.results.chunkAnalysis.async || this.results.chunkAnalysis.async.length === 0) {
      recommendations.push('建议使用更多的异步加载来减少初始包大小');
    }

    // 总包大小检查
    if (this.results.bundleSize.total > 1000000) { // > 1MB
      recommendations.push('总包大小过大，需要进一步优化');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 构建产物大小合理，优化效果良好！');
    }

    this.results.recommendations = recommendations;
  }

  // 打印报告
  printReport() {
    console.log('📊 构建分析报告');
    console.log('='.repeat(50));
    
    console.log('\n📈 性能评估:');
    const score = this.calculatePerformanceScore();
    console.log(`  总体评分: ${score}/100`);
    
    if (score >= 90) console.log('  🎉 优秀！');
    else if (score >= 75) console.log('  👍 良好');
    else if (score >= 60) console.log('  ⚠️ 需要改进');
    else console.log('  ❌ 需要大幅优化');

    console.log('\n💡 优化建议:');
    this.results.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    console.log('\n📋 详细数据:');
    console.log(`  构建时间: ${this.results.timestamp}`);
    console.log(`  分析路径: ${this.distPath}`);
    
    // 保存报告到文件
    this.saveReport();
  }

  // 计算性能评分
  calculatePerformanceScore() {
    let score = 100;

    // JavaScript 大小扣分
    if (this.results.bundleSize.javascript > 300000) score -= 20;
    else if (this.results.bundleSize.javascript > 200000) score -= 10;

    // CSS 大小扣分
    if (this.results.bundleSize.css > 50000) score -= 10;

    // 总大小扣分
    if (this.results.bundleSize.total > 800000) score -= 20;
    else if (this.results.bundleSize.total > 500000) score -= 10;

    // 代码分割加分
    if (this.results.chunkAnalysis.vendor) score += 5;
    if (this.results.chunkAnalysis.async && this.results.chunkAnalysis.async.length > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  // 保存报告
  saveReport() {
    const reportPath = path.join(__dirname, '../build-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 详细报告已保存到: ${reportPath}`);
  }

  // 辅助方法
  getFilesByExtension(extensions) {
    const exts = Array.isArray(extensions) ? extensions : [extensions];
    const files = [];

    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (exts.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    };

    walkDir(this.distPath);
    return files;
  }

  calculateTotalSize(files) {
    return files.reduce((total, file) => {
      return total + fs.statSync(file).size;
    }, 0);
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 运行分析
if (require.main === module) {
  const analyzer = new BuildAnalyzer();
  analyzer.analyze();
}

module.exports = BuildAnalyzer;
