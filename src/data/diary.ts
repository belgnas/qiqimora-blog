// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// 示例日记数据
const diaryData: DiaryItem[] = [
	// {
	// 	id: 1,
	// 	content:
	// 		"The falling speed of cherry blossoms is five centimeters per second!",
	// 	date: "2025-01-15T10:30:00Z",
	// 	images: ["/images/diary/sakura.jpg", "/images/diary/1.jpg"],
	// },
	{
		id: 1,
		content: "测试日记：樱花下落速度的每秒五厘米!",
		date: "2025-01-15T10:30:00Z", // 如果要加Z的话，意味着会往前推8个小时（北京时区）
		images: ["/images/diary/1.sakura1.jpg", "/images/diary/1.sakura2.jpg"],
	},
	{
		id: 2,
		content: "答应我，不要去后悔已经发生的事情，永远不要，并且一定要做到，这是约定，一定要做到，一定不要内耗，这是约定!",
		date: "2025-08-31T14:30:00",
	},
	{
		id: 3,
		content: "我做到了昨天的约定，今天完成了：早起跑步、上午开始工作，晚上8点休息的时侯，写了博客也看了番，最重要的是，今天我的一天相对于昨天来说平静了很多，我会在今天安排好明天的计划，并且明天会完成",
		date: "2025-09-01T22:00:00",
	},
	{
		id: 4,
		content: "有进小一个月没有写博客了，简单总结一下前几天：忙着利用阿里云部署自己的astro博客，组织国庆新生赛并负责近一半的出题，还有偷偷摸鱼(小声)，从今天开始继续写日记，今天完成了Java的基础语法的复习，天气开始冷了，明天开始要早点起床喵",
		date: "2025-10-14T22:00:00",
		images: ["/images/diary/20251014.webp"],
	},
	{
		id: 5,
		content: "今天晚上要完成全部的已经布置的作业，明天开始恢复刷算法题和背单词，在水课要坚持看《计算机科学导论》，打算在这个周看完。",
		date: "2025-10-15T22:30:00",
	},
	{
		id: 6,
		content: "一场完全没有剑与魔法的旅行为何也能有如此美丽到落泪的情怀",
		date: "2025-10-20T23:09:00",
		images: ["/images/diary/202510201.webp", "/images/diary/202510202.webp"],
	},
	{
		id: 7,
		content: "今天看到了Anny与nuero和evil彻底切割，才意识到原来自己潜意识里面是在默认相信Anny和Vedal的故事会永远进行下去，但是现在才意识到一开始就是不可能的，写到这里，或许一开始就是Anny需要并不是一个情感寄托，而是心理咨询，童年的阴影、家人的安危、国家的战争、生活的压力、以及网络上的舆论和骚扰之类的，这些才是Anny停播如此之久的原因，而在这段时间，Anny恰好遇到了那个几乎完美无缺的英国男子，neuro和evil的生父，20多岁的Vedal，几乎完美的处理着neuro的开发计划和自己的生活，对外表现是一个无聊的冷淡的讲着冷笑话的形象，但是似乎又将网络和现实几乎完全剥离的一个神，在网络上一行都放在如何打造neuro的账号上，从来没有对自己形象的任何运营，从而个人角度来讲，这几乎完美符合我个人对于一名技术人员的所有预期（但是我如果创造一个neuro这样类似的造物，我大抵上很难保持如此的冷静和不被情绪左右），打开《单相思》单曲循环，忍不住继续写点，对于我自己，对于初恋、爱慕、暗恋之类的理解和看法都非常非常的淡薄，反而是这次隐约从2个v上看出来了，至于最后有什么想说的：希望现实中这2个人以后都一切开开心心的，或许这才应该是我们大部分人的初衷。",
		date: "2025-10-21T22:39:00",
		images: ["/images/diary/202510211.jpg", "/images/diary/202510212.jpg", "/images/diary/202510213.jpg"],
	},
	{
		id: 8,
		content: "今天寝室换床，书很多，比较忙吧，明天无论如何都要加油",
		date: "2025-10-23T23:36:00",
	},
	{
		id: 9,
		content: "今天跑了体测的1000米，然后回宿舍刷了四五小时的Java基础语法题，果然还是直接写题目更能快速熟练一门语言",
		date: "2025-10-25T23:24:00",
	},
	{
		id: 9,
		content: "今天在Java实验课上闲了下来，打算趁这个时间写写今天的日记，今天还没结束，现在是3点过，距离晚上预定的正常休息时间21-22点还有6个多小时，我认为我应该要利用好5个小时以上，要学Java，mysql，这2个比较重要，15:00-16:30学数据库，16:30-17:30跑步洗澡，17:30-18:00吃饭洗衣服，18:00-21:00学Java，21:00-22:00学Linux，22:00以后看动漫玩游戏打电话。",
		date: "2025-10-27T15:21:00",
	},
	{
		id: 10,
		content: "前几天感冒发烧了，昨天今天病刚好，现在也在备考期末，养成每一天都提前写计划和当天计划必须要完成的习惯。",
		date: "2025-11-21T23:07:00",
	},
];

// 获取日记统计数据
export const getDiaryStats = () => {
	const total = diaryData.length;
	const hasImages = diaryData.filter(
		(item) => item.images && item.images.length > 0,
	).length;
	const hasLocation = diaryData.filter((item) => item.location).length;
	const hasMood = diaryData.filter((item) => item.mood).length;

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: Math.round((hasImages / total) * 100),
		locationPercentage: Math.round((hasLocation / total) * 100),
		moodPercentage: Math.round((hasMood / total) * 100),
	};
};

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
	const sortedData = diaryData.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取最新的日记
export const getLatestDiary = () => {
	return getDiaryList(1)[0];
};

// 根据ID获取日记
export const getDiaryById = (id: number) => {
	return diaryData.find((item) => item.id === id);
};

// 获取包含图片的日记
export const getDiaryWithImages = () => {
	return diaryData.filter((item) => item.images && item.images.length > 0);
};

// 根据标签筛选日记
export const getDiaryByTag = (tag: string) => {
	return diaryData
		.filter((item) => item.tags?.includes(tag))
		.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
};

// 获取所有标签
export const getAllTags = () => {
	const tags = new Set<string>();
	diaryData.forEach((item) => {
		if (item.tags) {
			item.tags.forEach((tag) => tags.add(tag));
		}
	});
	return Array.from(tags).sort();
};

export default diaryData;
