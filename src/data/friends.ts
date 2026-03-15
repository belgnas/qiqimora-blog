// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	// {
	// 	id: 1,
	// 	title: "Astro",
	// 	imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
	// 	desc: "The web framework for content-driven websites",
	// 	siteurl: "https://github.com/withastro/astro",
	// 	tags: ["Framework"],
	// },
	// {
	// 	id: 2,
	// 	title: "Mizuki Docs",
	// 	imgurl: "http://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg",
	// 	desc: "Mizuki User Manual",
	// 	siteurl: "https://docs.mizuki.mysqil.com",
	// 	tags: ["Docs"],
	// },
    {
		id: 1,
		title: "奇奇莫拉の日记本",
		imgurl: "https://qiqimora.cn/_astro/avatar.qk8rO0hW_1zxmdw.webp",
		desc: "咱是奇奇莫拉，今天也不想出门qwq",
		siteurl: "https://qiqimora.cn/",
		tags: ["自己", "二次元", "技术"],
	},
    {
		id: 2,
		title: "imicola",
		imgurl:
			"https://imicola.com/_astro/nona_cut.D2OfEpoP_Z1NkkW9.webp",
		desc: "世界第一可爱美少女(",
		siteurl: "https://imicola.com/",
		tags: ["二次元", "技术"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
