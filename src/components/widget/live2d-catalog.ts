/**
 * ⚠️ 本文件由 scripts/prepare-live2d-model.mjs 自动生成，请勿手改。
 *    重新生成：node scripts/prepare-live2d-model.mjs
 *
 * 这里只放「**模型事实**」：表情的中文名与参数表、动作的时长与参数表。
 * 「**编排**」（谁归哪个槽位、谁和谁互斥、哪些独立、哪些串成剧情链）
 * 全部在 **live2d-taxonomy.ts** 里手工维护 —— 那个文件才是你要改的。
 */

export interface Live2DExpressionEntry {
	readonly name: string;
	readonly label: string;
	/** 该表情驱动的参数 —— 运行时据此自动判定"硬冲突" */
	readonly params: readonly string[];
}

export interface Live2DMotionEntry {
	readonly group: string;
	/** 组内索引，用于精确播放某一个动作（model.motion(group, index)） */
	readonly index: number;
	readonly file: string;
	readonly label: string;
	readonly kind: "ambient" | "perform" | "prop";
	readonly duration: number;
	readonly params: readonly string[];
}

export const LIVE2D_EXPRESSIONS: readonly Live2DExpressionEntry[] = [
	{
		"name": "blush",
		"label": "脸红",
		"params": [
			"Paramhh2"
		]
	},
	{
		"name": "heart-eyes",
		"label": "爱心眼",
		"params": [
			"ParamCheek15",
			"ParamCheek17",
			"Paramhh2",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm"
		]
	},
	{
		"name": "star-eyes",
		"label": "星星眼",
		"params": [
			"ParamCheek16"
		]
	},
	{
		"name": "excited",
		"label": "开心兴奋",
		"params": [
			"ParamCheek76",
			"ParamEyeLOpen",
			"ParamEyeROpen",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm",
			"ParamMouthForm"
		]
	},
	{
		"name": "naughty",
		"label": "调皮",
		"params": [
			"ParamCheek21",
			"ParamEyeROpen",
			"ParamMouthForm"
		]
	},
	{
		"name": "angry",
		"label": "生气",
		"params": [
			"ParamCheek80",
			"ParamCheek23",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm"
		]
	},
	{
		"name": "sad",
		"label": "悲伤",
		"params": [
			"ParamCheek15",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRAngle",
			"ParamBrowRForm",
			"ParamMouthForm"
		]
	},
	{
		"name": "cry",
		"label": "哭",
		"params": [
			"ParamCheek20",
			"ParamCheek27",
			"ParamCheek23",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm"
		]
	},
	{
		"name": "dizzy",
		"label": "晕晕",
		"params": [
			"ParamCheek77",
			"ParamEyeLOpen",
			"ParamEyeROpen",
			"ParamBrowLY",
			"ParamBrowLForm",
			"ParamBrowRY",
			"ParamBrowRForm"
		]
	},
	{
		"name": "gloomy",
		"label": "阴暗",
		"params": [
			"Paramhh3"
		]
	},
	{
		"name": "blank-eyes",
		"label": "呆呆眼",
		"params": [
			"ParamCheek20"
		]
	},
	{
		"name": "drool",
		"label": "闭眼口水",
		"params": [
			"ParamCheek22"
		]
	},
	{
		"name": "tongue",
		"label": "吐舌",
		"params": [
			"ParamBrowRForm2",
			"ParamCheek79"
		]
	},
	{
		"name": "soul-out",
		"label": "吐魂",
		"params": [
			"ParamCheek18"
		]
	},
	{
		"name": "sweat",
		"label": "流汗",
		"params": [
			"ParamCheek19"
		]
	},
	{
		"name": "question",
		"label": "问号",
		"params": [
			"ParamCheek74"
		]
	},
	{
		"name": "exclaim",
		"label": "感叹号",
		"params": [
			"ParamCheek75"
		]
	},
	{
		"name": "heartbeat",
		"label": "心跳",
		"params": [
			"ParamCheek73"
		]
	},
	{
		"name": "mood-flower",
		"label": "情绪花花",
		"params": [
			"ParamCheek26"
		]
	},
	{
		"name": "love",
		"label": "love",
		"params": [
			"love"
		]
	},
	{
		"name": "glasses-round",
		"label": "圆眼镜",
		"params": [
			"ParamCheek70"
		]
	},
	{
		"name": "glasses-square",
		"label": "方眼镜",
		"params": [
			"ParamCheek72"
		]
	},
	{
		"name": "glasses-oval",
		"label": "椭圆眼镜",
		"params": [
			"ParamCheek10"
		]
	},
	{
		"name": "glasses-sun",
		"label": "墨镜",
		"params": [
			"ParamCheek71",
			"ParamEyeLOpen",
			"ParamEyeROpen"
		]
	},
	{
		"name": "headband",
		"label": "头箍",
		"params": [
			"ParamCheek38"
		]
	},
	{
		"name": "ponytail",
		"label": "单边马尾",
		"params": [
			"fx1"
		]
	},
	{
		"name": "sticker-cat",
		"label": "猫猫贴纸",
		"params": [
			"ParamCheek83"
		]
	},
	{
		"name": "sticker-rabbit",
		"label": "兔兔贴纸",
		"params": [
			"ParamCheek82"
		]
	},
	{
		"name": "sticker-bow",
		"label": "蝴蝶结贴纸",
		"params": [
			"ParamCheek81"
		]
	},
	{
		"name": "claw",
		"label": "魔爪",
		"params": [
			"mozhua"
		]
	},
	{
		"name": "claw-recolor",
		"label": "魔爪换色",
		"params": [
			"mozhua2"
		]
	},
	{
		"name": "tablecloth-dark",
		"label": "深色桌布",
		"params": [
			"cc2"
		]
	},
	{
		"name": "whale",
		"label": "鲸鱼",
		"params": [
			"jingyu"
		]
	},
	{
		"name": "whale-on-desk",
		"label": "鲸鱼放桌上",
		"params": [
			"fangzhuoshang"
		]
	},
	{
		"name": "phone-recolor",
		"label": "手机换色",
		"params": [
			"shouji"
		]
	},
	{
		"name": "omurice",
		"label": "蛋包饭",
		"params": [
			"point",
			"danbaofan"
		]
	},
	{
		"name": "parfait-off",
		"label": "巴菲",
		"params": [
			"baleite"
		]
	},
	{
		"name": "order-press",
		"label": "点菜按下",
		"params": [
			"pointZ"
		]
	},
	{
		"name": "undo",
		"label": "撤回",
		"params": [
			"chehui"
		]
	},
	{
		"name": "eraser",
		"label": "橡皮",
		"params": [
			"pi"
		]
	},
	{
		"name": "brush",
		"label": "画笔",
		"params": [
			"bi"
		]
	},
	{
		"name": "double-peace",
		"label": "双手比耶",
		"params": [
			"phone7"
		]
	},
	{
		"name": "cat-paws",
		"label": "喵喵手~喵~动画",
		"params": [
			"maoshou",
			"ParamCheek51",
			"ParamCheek61"
		]
	},
	{
		"name": "moemoeq",
		"label": "挤",
		"params": [
			"ji"
		]
	}
];

export const LIVE2D_MOTIONS: readonly Live2DMotionEntry[] = [
	{
		"group": "Idle",
		"index": 0,
		"file": "motions/idle.motion3.json",
		"label": "待机氛围",
		"kind": "ambient",
		"duration": 4,
		"params": [
			"Param73",
			"Param74",
			"Param75",
			"Param76",
			"maoshou2",
			"maoshou3",
			"maoshou4",
			"maoshou5",
			"maoshou6",
			"maoshou7",
			"j2",
			"j3",
			"j4",
			"j5",
			"j6",
			"j7",
			"j8",
			"j8_1",
			"j9",
			"j10",
			"j11",
			"j12",
			"j13",
			"j14",
			"j15",
			"j16",
			"j17",
			"j18",
			"j19",
			"j20",
			"j21",
			"j22",
			"j23",
			"j24",
			"j25",
			"j26",
			"j27",
			"j28",
			"j29",
			"j30",
			"j31",
			"j32",
			"j34",
			"j35",
			"j36",
			"j37",
			"j38",
			"j39",
			"j41",
			"j40",
			"j42",
			"j43",
			"j44",
			"j45",
			"j46",
			"j47",
			"j48",
			"j49",
			"j50",
			"j51",
			"j52",
			"j53",
			"j54",
			"j55",
			"j56",
			"j57",
			"ParamBreath4",
			"ParamBreath3",
			"Param_Angle_Rotation_1_xk4",
			"Param_Angle_Rotation_2_xk4",
			"Param_Angle_Rotation_3_xk4",
			"Param_Angle_Rotation_4_xk4",
			"Param_Angle_Rotation_5_xk4",
			"Param_Angle_Rotation_6_xk4",
			"Param_Angle_Rotation_7_xk4",
			"paopao",
			"paopao2",
			"paopao3",
			"paopao4",
			"paopao5",
			"Param77",
			"c1",
			"c2",
			"c3",
			"c4",
			"c5",
			"c6",
			"ParamCheek28",
			"ParamCheek36"
		]
	},
	{
		"group": "Tap",
		"index": 0,
		"file": "motions/bubblegum.motion3.json",
		"label": "吹泡泡糖",
		"kind": "prop",
		"duration": 5,
		"params": [
			"chuipaopao",
			"chuipaopao1",
			"chuipaopao5",
			"chuipaopao6",
			"chuipaopao2",
			"chuipaopao7",
			"chuipaopao3",
			"chuipaopao4"
		]
	},
	{
		"group": "Tap",
		"index": 1,
		"file": "motions/hammer.motion3.json",
		"label": "锤子",
		"kind": "perform",
		"duration": 4.767,
		"params": [
			"ParamCheek20",
			"ParamCheek27",
			"ParamCheek76",
			"ParamCheek77",
			"ParamCheek75",
			"ParamAngleX",
			"ParamAngleY",
			"ParamAngleZ",
			"Param",
			"ParamBodyAngleX",
			"ParamBodyAngleY",
			"ParamBodyAngleZ",
			"Param14",
			"Param13",
			"ParamEyeLOpen",
			"ParamEyeROpen",
			"ParamEyeBallX",
			"ParamEyeBallY",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm",
			"ParamMouthForm",
			"ParamMouthOpenY",
			"Param71",
			"Param72",
			"Param73",
			"Param74",
			"Param75",
			"Param76",
			"Param77",
			"Param70"
		]
	},
	{
		"group": "Tap",
		"index": 2,
		"file": "motions/spray.motion3.json",
		"label": "喷水",
		"kind": "prop",
		"duration": 0.467,
		"params": [
			"pengshui"
		]
	},
	{
		"group": "Selfie",
		"index": 0,
		"file": "motions/phone-open.motion3.json",
		"label": "开盖",
		"kind": "prop",
		"duration": 1,
		"params": [
			"pointZ2",
			"phone",
			"phone4",
			"phone6",
			"phone2"
		]
	},
	{
		"group": "Selfie",
		"index": 1,
		"file": "motions/selfie.motion3.json",
		"label": "自拍",
		"kind": "perform",
		"duration": 3.3,
		"params": [
			"ParamAngleX",
			"ParamAngleY",
			"ParamAngleZ",
			"ParamBodyAngleX",
			"ParamBodyAngleY",
			"ParamBodyAngleZ",
			"ParamEyeLOpen",
			"ParamEyeROpen",
			"ParamEyeBallX",
			"ParamEyeBallY",
			"ParamBrowLX",
			"ParamBrowLY",
			"ParamBrowLAngle",
			"ParamBrowLForm",
			"ParamBrowRX",
			"ParamBrowRY",
			"ParamBrowRAngle",
			"ParamBrowRForm",
			"ParamMouthForm",
			"ParamMouthOpenY",
			"phone",
			"phone4",
			"phone6",
			"phone3",
			"phone5"
		]
	},
	{
		"group": "Selfie",
		"index": 2,
		"file": "motions/selfie-quick.motion3.json",
		"label": "快速自拍",
		"kind": "prop",
		"duration": 1.267,
		"params": [
			"phone",
			"phone3"
		]
	},
	{
		"group": "Sauce",
		"index": 0,
		"file": "motions/sauce.motion3.json",
		"label": "番茄酱",
		"kind": "perform",
		"duration": 5,
		"params": [
			"ParamCheek21",
			"ParamAngleX",
			"ParamAngleY",
			"ParamAngleZ",
			"ParamEyeLOpen",
			"ParamEyeROpen",
			"ParamMouthForm",
			"ParamMouthOpenY",
			"keyboard",
			"point",
			"xbox",
			"danbaofan",
			"danbaoX",
			"danbaoY",
			"danbaoz",
			"ji",
			"aixing",
			"Param9"
		]
	}
];
