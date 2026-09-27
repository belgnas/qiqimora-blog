import type {
	AnnouncementConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	PermalinkConfig,
	ProfileConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// 移除i18n导入以避免循环依赖

// （有改动）
// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。
const SITE_TIMEZONE = 8; //设置你的网站时区 from -12 to 12 default in UTC+8
export const siteConfig: SiteConfig = {
	title: "奇奇莫拉の日记本",
	subtitle: "私人小网站",
	siteURL: "https://qiqimora.cn/", // 请替换为你的站点URL，以斜杠结尾
	siteStartDate: "2025-08-31", // 站点开始运行日期，用于站点统计组件计算运行天数

	timeZone: SITE_TIMEZONE,

	lang: SITE_LANG,

	themeColor: {
		hue: 185, // 主题色的默认色相，范围从 0 到 360。例如：红色：0，青色：200，蓝绿色：250，粉色：345
		fixed: false, // 对访问者隐藏主题色选择器
	},

	// 特色页面开关配置（关闭未使用的页面有助于提升 SEO，关闭后请记得在 navbarConfig 中移除对应链接）
	featurePages: {
		anime: true, // 番剧页面开关
		diary: true, // 日记页面开关
		friends: true, // 友链页面开关
		projects: true, // 项目页面开关
		skills: true, // 技能页面开关
		timeline: true, // 时间线页面开关
		albums: true, // 相册页面开关
		devices: true, // 设备页面开关
	},

	// 顶栏标题配置
	navbarTitle: {
		// 显示模式："text-icon" 显示图标+文本，"logo" 仅显示Logo
		mode: "logo",
		// 顶栏标题文本（logo 模式下不显示，切到 text-icon 模式时会用到）
		text: "奇奇莫拉の日记本",
		// 顶栏标题图标路径，默认使用 public/assets/home/home.png
		icon: "assets/home/home.png",
		// 网站Logo图片路径
		logo: "assets/home/logo.png",
	},

	// 页面自动缩放配置
	pageScaling: {
		enable: true, // 是否开启自动缩放
		targetWidth: 2000, // 目标宽度，低于此宽度时开始缩放
	},

	bangumi: {
		userId: "", // 留空 = 不启用 Bangumi 数据源（番剧页面当前走 anime.mode: "local" 本地配置）。要启用时填你的 Bangumi 用户 ID，可设 "sai" 测试
		fetchOnDev: false, // 是否在开发环境下获取 Bangumi 数据（默认 false），获取前先执行 pnpm build 构建 json 文件
	},

	bilibili: {
		vmid: "1808504869", // 你的B站 uid（来自空间链接 space.bilibili.com/1808504869）
		fetchOnDev: false, // 是否在开发环境下获取 Bilibili 数据（默认 false）
		coverMirror: "", // 封面图片镜像源（可选，如果需要使用镜像源，例如 "https://images.weserv.nl/?url="）
		useWebp: true, // 是否使用WebP格式（默认 true）

		// bilibili 观看进度配置说明(可选，如需配置仔细阅读):
		// 1. 本地开发：请在 .env 文件中填写 BILI_SESSDATA=your_SESSDATA
		// 2. 远程构建：请在 GitHub 仓库 Settings -> Secrets 中添加 BILI_SESSDATA
		// 注意：SESSDATA 为账号凭证，为防止泄露，切记不可使用硬编码。
		// 安全提示：如 SESSDATA 已泄露，请打开 B站手机端 —— 我的 —— 设置 —— 安全隐私 —— 登陆设备管理 —— 一键退登，销毁已泄露的账号凭证
	},

	anime: {
		mode: "local", // 番剧页面模式："bangumi" 使用Bangumi API，"local" 使用本地配置，"bilibili" 使用Bilibili API
	},

	// 文章列表布局配置
	postListLayout: {
		// 默认布局模式："list" 列表模式（单列布局），"grid" 网格模式（双列布局）
		// 注意：如果侧边栏配置启用了"both"双侧边栏，则无法使用文章列表"grid"网格（双列）布局
		defaultMode: "list",
		// 是否允许用户切换布局
		allowSwitch: true,
	},

	// 标签样式配置
	tagStyle: {
		// 是否使用新样式（悬停高亮样式）还是旧样式（外框常亮样式）
		useNewStyle: false,
	},

	// 壁纸模式配置
	wallpaperMode: {
		// 默认壁纸模式：banner=顶部横幅，fullscreen=全屏壁纸，none=无壁纸
		defaultMode: "banner",
		// 整体布局方案切换按钮显示设置（默认："desktop"）
		// "off" = 不显示
		// "mobile" = 仅在移动端显示
		// "desktop" = 仅在桌面端显示
		// "both" = 在所有设备上显示
		showModeSwitchOnMobile: "desktop",
	},

	// （有改动）
	banner: {
		// 支持单张图片或图片数组，当数组长度 > 1 时自动启用轮播
		src: {
			desktop: [
				"/assets/desktop-banner/1.webp",
				"/assets/desktop-banner/2.webp",
				"/assets/desktop-banner/3.webp",
				"/assets/desktop-banner/4.webp",
				"/assets/desktop-banner/5.webp",
				"/assets/desktop-banner/6.webp",
				"/assets/desktop-banner/7.webp",
				"/assets/desktop-banner/8.webp",
				"/assets/desktop-banner/9.webp",
				"/assets/desktop-banner/10.webp",
			], // 桌面横幅图片
			mobile: [
				"/assets/mobile-banner/1.webp",
				"/assets/mobile-banner/2.webp",
				"/assets/mobile-banner/3.webp",
			], // 移动横幅图片
		}, // 使用本地横幅图片

		position: "center", // 等同于 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'

		carousel: {
			enable: true, // 为 true 时：为多张图片启用轮播。为 false 时：从数组中随机显示一张图片
			interval: 4, // 轮播间隔时间（秒）
		},

		waves: {
			enable: true, // 是否启用水波纹效果（注意：此功能性能开销较大）
			performanceMode: false, // 性能模式：减少动画复杂度(性能提升40%)
			mobileDisable: false, // 移动端禁用
		},

		// PicFlow API支持(智能图片API)
		imageApi: {
			enable: false, // 启用图片API
			url: "http://domain.com/api_v2.php?format=text&count=4", // API地址，返回每行一个图片链接的文本
		},
		// 这里需要使用PicFlow API的Text返回类型,所以我们需要format=text参数
		// 项目地址:https://github.com/matsuzaka-yuki/PicFlow-API
		// 请自行搭建API

		homeText: {
			enable: true, // 在主页显示自定义文本
			title: "奇奇莫拉の日记", // 主页横幅主标题

			subtitle: [
				"特別なことはないけど、君がいると十分です", // 虽然没有什么特别的事，但只要有你在就足够了。
				"虽然没有什么特别的事，但只要有你在就足够了。",
				"今でもあなたは私の光", // 如今你依然是我的光。
				"如今你依然是我的光",
				"君ってさ、知らないうちに私の毎日になってたよ", // 你啊，不知不觉间就成了我生活的日常。
				"你啊，不知不觉间就成了我生活的日常",
				"君と話すと、なんか毎日がちょっと楽しくなるんだ", // 和你说话的话，总觉得每一天都变得稍微开心起来了。
				"和你说话的话，总觉得每一天都变得稍微开心起来了",
				"今日はなんでもない日。でも、ちょっとだけいい日", // 今天是平凡无奇的一天。但，是稍微有点美好的一天。
				"今天是平凡无奇的一天。但，是稍微有点美好的一天",
			],
			typewriter: {
				enable: true, // 启用副标题打字机效果

				speed: 100, // 打字速度（毫秒）
				deleteSpeed: 50, // 删除速度（毫秒）
				pauseTime: 2000, // 完全显示后的暂停时间（毫秒）
			},
		},

		credit: {
			enable: false, // 显示横幅图片来源文本

			text: "Describe", // 要显示的来源文本
			url: "", // （可选）原始艺术品或艺术家页面的 URL 链接
		},

		navbar: {
			transparentMode: "semifull", // 导航栏透明模式："semi" 半透明加圆角，"full" 完全透明，"semifull" 动态透明
		},
	},
	toc: {
		enable: true, // 启用目录功能
		mode: "sidebar", // 目录显示模式："float" 悬浮按钮模式，"sidebar" 侧边栏模式
		depth: 2, // 目录深度，1-6，1 表示只显示 h1 标题，2 表示显示 h1 和 h2 标题，依此类推
		useJapaneseBadge: true, // 使用日语假名标记（あいうえお...）代替数字，开启后会将 1、2、3... 改为 あ、い、う...
	},
	showCoverInContent: true, // 在文章内容页显示文章封面
	generateOgImages: false, // 启用生成OpenGraph图片功能,注意开启后要渲染很长时间，不建议本地调试的时候开启
	favicon: [
		// 自己的头像做 favicon（903x903 方图，sharp 生成的 PNG 在 public/favicon/ 下）
		{
			src: "/favicon/icon.png",
			theme: "light",
			sizes: "512x512",
		},
		{
			src: "/favicon/icon.png",
			theme: "dark",
			sizes: "512x512",
		},
		{
			src: "/favicon/icon-32.png",
			sizes: "32x32",
		},
	],

	// 字体配置
	font: {
		// 注意：自定义字体需要在 src/styles/main.css 中引入字体文件
		// 注意：字体子集优化功能目前仅支持 TTF 格式字体,开启后需要在生产环境才能看到效果,在Dev环境下显示的是浏览器默认字体!
		asciiFont: {
			// 英文字体 - 优先级最高
			// 指定为英文字体则无论字体包含多大范围，都只会保留 ASCII 字符子集
			fontFamily: "Consola",
			fontWeight: "500",
			localFonts: ["Consola.ttf"],
			enableCompress: true, // 启用字体子集优化，减少字体文件大小
		},
		cjkFont: {
			// 中日韩字体 - 作为回退字体
			fontFamily: "LXGWWenKaiMono-Regular.ttf",
			fontWeight: "400",
			localFonts: ["LXGWWenKaiMono-Regular.ttf"],
			enableCompress: true, // 启用字体子集优化，减少字体文件大小
		},
	},
	showLastModified: true, // 控制“上次编辑”卡片显示的开关
};

// （有改动）
export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	src: {
		desktop: [
			"/assets/desktop-banner/1.webp",
			"/assets/desktop-banner/2.webp",
			"/assets/desktop-banner/3.webp",
			"/assets/desktop-banner/4.webp",
			"/assets/desktop-banner/5.webp",
			"/assets/desktop-banner/6.webp",
			"/assets/desktop-banner/7.webp",
			"/assets/desktop-banner/8.webp",
			"/assets/desktop-banner/9.webp",
			"/assets/desktop-banner/10.webp",
		], // 桌面横幅图片
		mobile: [
			"/assets/mobile-banner/1.webp",
			"/assets/mobile-banner/2.webp",
			"/assets/mobile-banner/3.webp",
		], // 移动横幅图片
	}, // 使用本地横幅图片
	position: "center", // 壁纸位置，等同于 object-position
	carousel: {
		enable: true, // 启用轮播
		interval: 8, // 轮播间隔时间（秒）
	},
	zIndex: -1, // 层级，确保壁纸在背景层
	opacity: 0.8, // 壁纸透明度
	blur: 1, // 背景模糊程度
};

// （有改动）
export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		// 支持自定义导航栏链接，支持多级菜单
		{
			name: "Links", // "链接"（会自动翻译）
			url: "/links/",
			icon: "material-symbols:link",
			children: [
				{
					name: "GitHub",
					url: "https://github.com/belgnas?tab=repositories",
					external: true,
					icon: "fa7-brands:github",
				},
				{
					name: "Bilibili",
					url: "https://space.bilibili.com/1808504869",
					external: true,
					icon: "fa7-brands:bilibili",
				},
				{
					name: "Gitee",
					url: "https://gitee.com/belgnas",
					external: true,
					icon: "mdi:git",
				},
			],
		},
		{
			name: "My",
			url: "#", // 父级带子菜单时渲染为按钮不导航，此 url 仅作兜底
			icon: "material-symbols:person",
			children: [
				{
					name: "Anime",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "Diary",
					url: "/diary/",
					icon: "material-symbols:book",
				},
				{
					name: "Gallery",
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
				{
					name: "Devices",
					url: "/devices/",
					icon: "material-symbols:devices",
					external: false,
				},
			],
		},
		{
			name: "About",
			url: "#", // 父级带子菜单时渲染为按钮不导航，此 url 仅作兜底
			icon: "material-symbols:info",
			children: [
				{
					name: "About",
					url: "/about/",
					icon: "material-symbols:person",
				},
				{
					name: "Friends",
					url: "/friends/",
					icon: "material-symbols:group",
				},
			],
		},
		{
			name: "Others",
			url: "#",
			icon: "material-symbols:more-horiz",
			children: [
				{
					name: "Projects",
					url: "/projects/",
					icon: "material-symbols:work",
				},
				{
					name: "Skills",
					url: "/skills/",
					icon: "material-symbols:psychology",
				},
				{
					name: "Timeline",
					url: "/timeline/",
					icon: "material-symbols:timeline",
				},
			],
		},
	],
};

// （有改动）
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "キキモラ-奇奇莫拉", // 奇奇莫拉
	bio: "咱是奇奇莫拉，喜欢看番、画画、写日记", // 世界很大，你必须去看看。
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/1808504869",
		},
		{
			name: "Gitee",
			icon: "mdi:git",
			url: "https://gitee.com/belgnas",
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/belgnas",
		},
		// {
		// 	name: "Codeberg",
		// 	icon: "simple-icons:codeberg",
		// 	url: "https://codeberg.org",
		// },
		// {
		// 	name: "Discord",
		// 	icon: "fa7-brands:discord",
		// 	url: "https://discord.gg/MqW6TcQtVM",
		// },
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

// Permalink 固定链接配置
export const permalinkConfig: PermalinkConfig = {
	enable: false, // 是否启用全局 permalink 功能，关闭时使用默认的文件名作为链接
	/**
	 * permalink 格式模板
	 * 支持的占位符：
	 * - %year% : 4位年份 (2024)
	 * - %monthnum% : 2位月份 (01-12)
	 * - %day% : 2位日期 (01-31)
	 * - %hour% : 2位小时 (00-23)
	 * - %minute% : 2位分钟 (00-59)
	 * - %second% : 2位秒数 (00-59)
	 * - %post_id% : 文章序号（按发布时间升序排列，最早的文章为1）
	 * - %postname% : 文章文件名（slug）
	 * - %category% : 分类名（无分类时为 "uncategorized"）
	 *
	 * 示例：
	 * - "%year%-%monthnum%-%postname%" => "/2024-12-my-post/"
	 * - "%post_id%-%postname%" => "/42-my-post/"
	 * - "%category%-%postname%" => "/tech-my-post/"
	 *
	 * 注意：不支持斜杠 "/"，所有生成的链接都在根目录下
	 */
	format: "%postname%", // 默认使用文件名
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景颜色）已被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择深色主题，因为此博客主题目前仅支持深色背景
	theme: "github-dark",
	// 是否在主题切换时隐藏代码块以避免卡顿问题
	hideDuringThemeTransition: true,
};

export const commentConfig: CommentConfig = {
	enable: false, // 暂不启用评论。想开的话：按 https://twikoo.js.org/ 自部署一份后端，把 envId 换成自己的地址，再改 true
	twikoo: {
		envId: "", // 留空：https://twikoo.vercel.app 是官方演示环境，数据不归自己，直接开也用不了
		lang: SITE_LANG,
	},
};

export const shareConfig: ShareConfig = {
	enable: true, // 启用分享功能
};

// （有改动）
export const announcementConfig: AnnouncementConfig = {
	title: "", // 公告标题，填空使用i18n字符串Key.announcement
	content: "これは私が真剣に書いた日記なの。もし良かったら、見てくれませんか？（这是我认真写的日记。要是你愿意的话，能看看吗？）", // 公告内容 // 这是我认真写的日记。要是你愿意的话，能看看吗？
	closable: true, // 允许用户关闭公告
	link: {
		enable: true, // 启用链接
		text: "自我介绍", // 链接文本
		url: "/about/", // 链接 URL
		external: false, // 内部链接
	},
};

// （有改动）
//用到的网易云歌单分享链接
// https://music.163.com/playlist?id=17638051312&uct2=U2FsdGVkX1/33Pzu8NReaYsrKVym2m6lPoPbD2Fo6u0=
export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true, // 启用音乐播放器功能
	mode: "meting", // 音乐播放器模式，可选 "local" 或 "meting"
	meting_api:
		"https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r", // Meting API 地址
	id: "17638051312", // 歌单ID
	server: "netease", // 音乐源服务器。有的meting的api源支持更多平台,一般来说,netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
	type: "playlist", // 播单类型
};

export const footerConfig: FooterConfig = {
	enable: true, // 是否启用Footer HTML注入功能
	customHtml: `
<div class="flex flex-col items-center gap-1 py-2 text-sm">
	<div>
		© ${new Date().getFullYear()}
		<a href="/about/" class="transition hover:text-[var(--primary)]">奇奇莫拉</a>
		· Powered by
		<a href="https://astro.build" target="_blank" rel="noopener noreferrer" class="transition hover:text-[var(--primary)]">Astro</a>
	</div>
	<!--
		ICP 备案号位置：暂不展示（避免出现未确认的号码）。
		拿到真实备案号后，在此处加入一行：
		    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">你的备案号</a>
		查询入口：https://beian.miit.gov.cn/
	-->
</div>`,
	// 也可以直接编辑 FooterConfig.html 文件来添加备案号等自定义内容
	// 注意：若 customHtml 不为空，则使用 customHtml 中的内容；若 customHtml 留空，则使用 FooterConfig.html 文件中的内容
	// FooterConfig.html 可能会在未来的某个版本弃用
};

/**
 * 侧边栏布局配置
 * 用于控制侧边栏组件的显示、排序、动画和响应式行为
 * sidebar: 控制组件所在的侧边栏（left 或 right）。注意：移动端通常不显示右侧栏内容。若组件设置在 right，请确保 layout.position 为 "both"。
 */
export const sidebarLayoutConfig: SidebarLayoutConfig = {
	// 侧边栏组件属性配置列表
	properties: [
		{
			// 组件类型：用户资料组件
			type: "profile",
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名，用于应用样式和动画
			class: "onload-animation",
			// 动画延迟时间（毫秒），用于错开动画效果
			animationDelay: 0,
		},
		{
			// 组件类型：公告组件
			type: "announcement",
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 50,
		},
		{
			// 组件类型：分类组件
			type: "categories",
			// 组件位置："sticky" 表示粘性定位，可滚动
			position: "sticky",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 150,
			// 响应式配置
			responsive: {
				// 折叠阈值：当分类数量超过5个时自动折叠
				collapseThreshold: 5,
			},
		},
		{
			// 组件类型：标签组件
			type: "tags",
			// 组件位置："sticky" 表示粘性定位
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
			// 响应式配置
			responsive: {
				// 折叠阈值：当标签数量超过20个时自动折叠
				collapseThreshold: 20,
			},
		},
		{
			// 组件类型：站点统计组件
			type: "site-stats",
			// 组件位置
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 200,
		},
		{
			// 组件类型：日历组件(移动端不显示)
			type: "calendar",
			// 组件位置
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
		},
	],

	// 侧栏组件布局配置
	components: {
		left: ["profile", "announcement", "categories", "tags"],
		right: ["site-stats", "calendar"],
		drawer: ["profile", "announcement", "categories", "tags"],
	},

	// 默认动画配置
	defaultAnimation: {
		// 是否启用默认动画
		enable: true,
		// 基础延迟时间（毫秒）
		baseDelay: 0,
		// 递增延迟时间（毫秒），每个组件依次增加的延迟
		increment: 50,
	},

	// 响应式布局配置
	responsive: {
		// 断点配置（像素值）
		breakpoints: {
			// 移动端断点：屏幕宽度小于768px
			mobile: 768,
			// 平板端断点：屏幕宽度小于1280px
			tablet: 1280,
			// 桌面端断点：屏幕宽度大于等于1280px
			desktop: 1280,
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: false, // 默认关闭樱花特效
	sakuraNum: 21, // 樱花数量
	limitTimes: -1, // 樱花越界限制次数，-1为无限循环
	size: {
		min: 0.5, // 樱花最小尺寸倍数
		max: 1.1, // 樱花最大尺寸倍数
	},
	opacity: {
		min: 0.3, // 樱花最小不透明度
		max: 0.9, // 樱花最大不透明度
	},
	speed: {
		horizontal: {
			min: -1.7, // 水平移动速度最小值
			max: -1.2, // 水平移动速度最大值
		},
		vertical: {
			min: 1.5, // 垂直移动速度最小值
			max: 2.2, // 垂直移动速度最大值
		},
		rotation: 0.03, // 旋转速度
		fadeSpeed: 0.03, // 消失速度，不应大于最小不透明度
	},
	zIndex: 100, // 层级，确保樱花在合适的层级显示
};

//（有改动）
// Pio 看板娘配置
//
// 运行时说明：
//   runtime: "cubism5" —— PixiJS 8 + pixi-live2d-display(Cubism 5) + 官方 Cubism Core 5，
//                        支持 .moc3（Cubism 3/4/5，含 VTube Studio 导出的模型）。
//                        实现见 src/components/widget/live2d-runtime.ts
//   想回到原来的 Cubism 2.1 猫娘：把 runtime 改成 "legacy"，
//   并把 models 换回 ["/pio/models/pio/model.json"] 即可（老的 l2d.js 一直保留着）。
//
// 当前模型：DS鲸鱼娘（作者：B站 @氵六青 11272072）
//   授权：无偿分享，允许商用直播/自印物料，禁止盗用与出售。
//   原文见 public/live2d/models/ds-whale/NOTICE.txt
//   模型资源由 scripts/prepare-live2d-model.mjs 从 other/DS鲸鱼娘/ 整理生成。
export const pioConfig: import("./types/config").PioConfig = {
	enable: true, // 启用看板娘
	models: ["/live2d/models/ds-whale/c_0120.model3.json"], // 默认模型路径
	runtime: "cubism5", // 渲染运行时
	position: "left", // 模型位置
	// 画布尺寸按「角色实际宽高比」定，不要用模型画布的正方形。
	//
	// 模型画布是 4068×4068，但角色只占其中 81.7% 宽 × 77.4% 高（实测，见下），
	// 用正方形画布会在四周留出大片空白 —— 而空白区域**照样能拖动、也会挡住页面点击**，
	// 观感上就是"能拖的地方比角色大一圈"。
	// 角色宽高比 343:325 = 1.0556 → 画布按这个比例设，正好贴合。
	//
	// `height` 决定**角色多大**（取景按高度铺满），`width` 决定**左右各留多少余量**。
	// 取景用 `min(宽/内容宽, 高/内容高)`，所以只要宽度够，加宽不会放大角色。
	//
	// ⚠️ 这两个数是按**全部动作播一遍**量的，不是静态快照、也不只是待机：
	//   · 静态一帧：角色占模型画布 81.7% 宽 × 77.4% 高，中心 (54.8%, 47.6%)
	//   · 只播待机（407 帧）：99.55% 宽 × 101.75% 高，中心 (61.77%, 58.53%)
	//   · **全部动作播一遍（1138 帧）：104.08% 宽 × 101.75% 高，中心 (64.03%, 58.53%)**
	//     —— 尾巴会甩出去、锤子会把手举过顶，用力时比待机更宽
	//   动画会把包络撑大一大截，必须按最坏情况配，并且**留够余量**。
	//
	// 取值推导（目标：角色视觉大小不变，实际缩放 0.0818；上下留够余量、顶部再多留一点）：
	//   内容高 1.0175 × 4068 × 0.0818 ≈ 339  →  height = 391（上下各约 26px）
	//   内容宽 1.0408 × 4068 × 0.0818 ≈ 346  →  width  = 398（左右各约 26px）
	//   取 height < width，取景由高度决定 → zoom = 0.0818 / (391 / 4068) ≈ 0.851
	//   平移按全动作并集的中心对齐，再把模型**往下挪约 10px**，把余量让给顶部
	//   （锤子会把手举过顶，顶部需要更多空间）：
	//     offsetX = -(0.6403 - 0.5) × 0.0818 × 4068 / 398 ≈ -0.118
	//     offsetY = -0.0726（居中）+ 10 / 391 ≈ -0.047   → 顶部约 36px、底部约 16px
	//     （offsetY 为负 = 模型上移；要往下挪就往正值方向调）
	width: 398,
	height: 391,
	mode: "draggable", // 默认为可拖拽模式
	hiddenOnMobile: true, // 默认在移动设备上隐藏

	// 取景：zoom=1 表示整幅模型画布刚好装下；调大即放大。
	//
	// 下面这组数是**实测算出来的**（把画布涂品红、只留 #pio，读非品红像素的包围盒）：
	//   · 静态一帧：角色占模型画布 81.7% × 77.4%，中心在 (54.8%, 47.6%)
	//   · **动画 407 帧并集**：占 99.55% 宽 × 101.75% 高，中心在 (61.77%, 58.53%)
	//     —— 尾巴会甩出去、锤子动画会把手举过顶，两个极值都比静态大一截
	//   · `zoom` 的目标是让**角色的视觉尺寸**保持合理（约 0.0818 的实际缩放，
	//     静态时角色约 272px 宽 —— 和之前一样的观感）：
	//       s = min(350/4068, 358/4068) × zoom = (350/4068) × zoom = 0.0818  →  zoom ≈ 0.951
	//   · 平移按**动画并集的中心**对齐，这样甩尾/举锤的余量是四周均衡的：
	//     offsetX = -(0.6403 - 0.5) × 0.0818 × 4068 / 398 ≈ -0.118
	//     offsetY = -0.0726（居中）+ 16 / 391 ≈ -0.032   → 顶部约 42px、底部约 10px
	//     （offsetY 为负 = 模型上移；调大就往**下**挪 = 顶部余量变大、底部变小）
	//
	// 只想"顶部再多一点"时，**只改这个 offsetY 就够了** —— 画布尺寸、zoom、
	// 角色大小都不受影响。每 0.01 大约对应 3.9px（= 391 × 0.01）。
	framing: {
		zoom: 0.851,
		offsetX: -0.118,
		offsetY: -0.032,
	},

	// 点击模型时随机切换的表情。
	//
	// ⚠️ 现在**只有在没挂面板时才会用到**（pioConfig.panel === false）。
	//    挂了面板时，点击宠物由面板的「表情」栏负责摇
	//    （见 PioPanel.svelte 的 rollEmotion + runtime.setEmotionRoller）——
	//    因为面板才是表情的唯一真相源，否则两套状态并存会出现
	//    「星星眼 + 爱心眼」这种共用眉毛参数的冲突。
	//
	// 这里保持和面板「表情」栏一致的 14 个情绪表情。
	expressions: [
		"blush",
		"heart-eyes",
		"star-eyes",
		"excited",
		"naughty",
		"angry",
		"sad",
		"cry",
		"dizzy",
		"gloomy",
		"blank-eyes",
		"drool",
		"tongue",
		"soul-out",
	],


	// 表情保持 0 秒后不自动恢复（= 保持到下次点击）；想让它自己变回去就填毫秒数，例如 4000
	expressionHoldMs: 0,

	dialog: {
		welcome: "你好啊！", // 欢迎词
		touch: [
			"盯————！被发现了?",
			"摸摸我!",
			"看不懂qwq",
			"什么时候下班呢？",
			"不要戳我啦!",
		], // 触摸提示
		home: "魔法：回到首页!", // 首页提示
		skin: ["想看我的新衣服吗？", "新衣服 好看喵~"], // 换装提示
		close: "qwq 要走了吗~", // 关闭提示
		link: "https://github.com/belgnas", // 关于链接
	},
};

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	pio: pioConfig,
	share: shareConfig,
} as const;

// umamiConfig相关配置已移动至astro.config.mjs中,统计脚本请自行在Layout.astro文件的<head>中插入
