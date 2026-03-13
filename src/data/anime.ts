// 本地番剧数据配置
export type AnimeItem = {
	title: string;
	status: "watching" | "completed" | "planned";
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string[];
	studio: string;
	link: string;
	progress: number;
	totalEpisodes: number;
	startDate: string;
	endDate: string;
};

const localAnimeList: AnimeItem[] = [
// 	例子：
	// {
    // title: "轻音少女", // 标题
    // status: "completed", // 状态（status: "watching" | "completed" | "planned"）
    // rating: 9.5, // 评分
    // cover: "/assets/anime/clannad.webp", // 封面
    // description: "女孩子们的日常，甜美治愈", // 描述
    // episodes: "12 episodes", // 集数
    // year: "2015", // 年份
    // genre: ["日常", "治愈"], // 类型
    // studio: "京都动画", // 制作公司
    // link: "https://www.bilibili.com/bangumi/media/md2590", // 链接
    // progress: 12, // 观看进度
    // totalEpisodes: 12, // 总集数
    // startDate: "2015-07", // 开始观看
    // endDate: "2015-09", // 完成观看
  	// },

	{
		title: "clannad", // 番剧标题
		status: "watching", // 观看状态（"watching" 或 "completed"）
		rating: 9.5, // 评分（0-10）
		cover: "/assets/anime/clannad.webp", // 封面图片路径（相对于 public 目录）
		description: "写做clannad 读作人生", // 番剧描述
		episodes: "22 episodes", // 集数信息
		year: "2007", // 播放年份
		genre: ["gal改"], // 番剧类型(不可省略)
		studio: "A-1 Pictures", // 番剧 Studio
		link: "https://www.bilibili.com/bangumi/play/ep34489", // 番剧链接（可指向 Bilibili 或其他平台）
		progress: 1, // 当前进度（集数）
		totalEpisodes: 22, // 总集数
		startDate: "2022-07", // 开始播放日期
		endDate: "2022-09", // 结束播放日期
	}, 
	{
		title: "转生成为魔剑", // 番剧标题
		status: "completed", // 观看状态（"watching" 或 "completed"）
		rating: 8, // 评分（0-10）
		cover: "/assets/anime/转生成为魔剑.webp", // 封面图片路径（相对于 public 目录）
		description: "可爱猫猫头，太可爱啦", // 番剧描述
		episodes: "12 episodes", // 集数信息
		year: "2022", // 播放年份
		genre: ["异世界"], // 番剧类型(不可省略)
		studio: "A-1 Pictures", // 番剧 Studio
		link: "https://dm.xifanacg.com/bangumi/1413.html", // 番剧链接（可指向 Bilibili 或其他平台）
		progress: 12, // 当前进度（集数）
		totalEpisodes: 12, // 总集数
		startDate: "2022-07", // 开始播放日期
		endDate: "2022-09", // 结束播放日期
	},
	{
		title: "狼与香辛料", // 番剧标题
		status: "watching", // 观看状态（"watching" 或 "completed"）
		rating: 9.5, // 评分（0-10）
		cover: "/assets/anime/狼与香辛料.jpg", // 封面图片路径（相对于 public 目录）
		description: "旅途上两个相互理解的灵魂，每读一遍都有新的滋味", // 番剧描述
		episodes: "13 episodes", // 集数信息
		year: "2008", // 播放年份
		genre: ["萌狼", "轻小说改", "无魔法"], // 番剧类型(不可省略)
		studio: "IMAGIN", // 番剧 Studio
		link: "https://dm1.xfdm.pro/bangumi/1847.html", // 番剧链接（可指向 Bilibili 或其他平台）
		progress: 6, // 当前进度（集数）
		totalEpisodes: 13, // 总集数
		startDate: "2022-07", // 开始播放日期
		endDate: "2022-09", // 结束播放日期
	},
	{
		title: "狼与香辛料Ⅱ", // 番剧标题
		status: "watching", // 观看状态（"watching" 或 "completed"）
		rating: 9.4, // 评分（0-10）
		cover: "/assets/anime/狼与香辛料Ⅱ.jpg", // 封面图片路径（相对于 public 目录）
		description: "无良夫妻行骗记", // 番剧描述
		episodes: "12 episodes", // 集数信息
		year: "2009", // 播放年份
		genre: ["萌狼", "轻小说改", "无魔法"], // 番剧类型(不可省略)
		studio: "Brain's Base", // 番剧 Studio
		link: "https://dm1.xfdm.pro/bangumi/1851.html", // 番剧链接（可指向 Bilibili 或其他平台）
		progress: 0, // 当前进度（集数）
		totalEpisodes: 12, // 总集数
		startDate: "2022-07", // 开始播放日期
		endDate: "2022-09", // 结束播放日期
	},
];

export default localAnimeList;
