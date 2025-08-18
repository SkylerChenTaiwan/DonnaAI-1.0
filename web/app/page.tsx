export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            DonnaAI Web Platform
          </h1>
          <p className="text-lg text-text-secondary">
            Next.js 14 基礎架構已就緒
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface rounded-md p-6 border border-border-light shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
              <h3 className="font-semibold text-text-primary">Next.js 14</h3>
            </div>
            <p className="text-sm text-text-secondary">
              App Router 和 Turbopack 已配置
            </p>
          </div>

          <div className="bg-surface rounded-md p-6 border border-border-light shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
              <h3 className="font-semibold text-text-primary">TypeScript</h3>
            </div>
            <p className="text-sm text-text-secondary">
              嚴格模式和型別檢查已啟用
            </p>
          </div>

          <div className="bg-surface rounded-md p-6 border border-border-light shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
              <h3 className="font-semibold text-text-primary">Tailwind CSS</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Notion 風格設計系統已整合
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-button-primary hover:bg-button-primary-hover text-text-inverse px-6 py-3 rounded-button font-medium transition-colors duration-[var(--transition-fast)]">
            開始開發
          </button>
          <button className="bg-button-secondary hover:bg-button-secondary-hover text-primary px-6 py-3 rounded-button font-medium transition-colors duration-[var(--transition-fast)]">
            查看文件
          </button>
        </div>

        {/* Design System Demo */}
        <div className="mt-12 p-6 bg-background-input rounded-lg border border-border-light">
          <h4 className="font-semibold text-text-primary mb-4">設計系統測試</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="w-8 h-8 bg-primary-900 rounded"></div>
            <div className="w-8 h-8 bg-primary-700 rounded"></div>
            <div className="w-8 h-8 bg-primary-500 rounded"></div>
            <div className="w-8 h-8 bg-primary-300 rounded"></div>
            <div className="w-8 h-8 bg-primary-100 rounded"></div>
            <div className="w-8 h-8 bg-success rounded"></div>
            <div className="w-8 h-8 bg-warning rounded"></div>
            <div className="w-8 h-8 bg-error rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
