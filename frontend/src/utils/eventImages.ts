import ikebukuroImage from "../assets/cities/ikebukuro.png";
import shinjukuImage from "../assets/cities/shinjuku.png";
import shibuyaImage from "../assets/cities/shibuya.png";
import uenoImage from "../assets/cities/ueno.png";
import nagoyaImage from "../assets/cities/nagoya.png";
import osakaImage from "../assets/cities/osaka.png";
import akihabaraImage from "../assets/cities/akihabara.png";
import nakanoImage from "../assets/cities/nakano.png";
import taipeiImage from "../assets/cities/taipei.png";
import yokohamaImage from "../assets/cities/yokohama.png";
import kichijojiImage from "../assets/cities/kichijoji.png";
import defaultImage from "../assets/cities/default.png";

// 開催場所の選択肢
export const EVENT_LOCATION_OPTIONS = [
  "池袋",
  "新宿",
  "渋谷",
  "上野",
  "秋葉原",
  "中野",
  "吉祥寺",
  "横浜",
  "名古屋",
  "大阪",
  "台北",
];

// 都市画像の情報
export interface CityImageInfo {
  src: string;
  label: string;
  isDefault: boolean;
}

// 開催場所から表示する画像を決める
export function getCityImageInfo(
  location: string
): CityImageInfo {
  const cityImages = [
    {
      keywords: ["池袋"],
      src: ikebukuroImage,
      label: "池袋の都市画像",
    },
    {
      keywords: ["新宿"],
      src: shinjukuImage,
      label: "新宿の都市画像",
    },
    {
      keywords: ["渋谷"],
      src: shibuyaImage,
      label: "渋谷の都市画像",
    },
    {
      keywords: ["上野"],
      src: uenoImage,
      label: "上野の都市画像",
    },
    {
      keywords: ["名古屋"],
      src: nagoyaImage,
      label: "名古屋の都市画像",
    },
    {
      keywords: ["大阪"],
      src: osakaImage,
      label: "大阪の都市画像",
    },
    {
      keywords: ["秋葉原"],
      src: akihabaraImage,
      label: "秋葉原の都市画像",
    },
    {
      keywords: ["中野"],
      src: nakanoImage,
      label: "中野の都市画像",
    },
    {
      keywords: ["台北"],
      src: taipeiImage,
      label: "台北の都市画像",
    },
    {
      keywords: ["横浜"],
      src: yokohamaImage,
      label: "横浜の都市画像",
    },
    {
      keywords: ["吉祥寺"],
      src: kichijojiImage,
      label: "吉祥寺の都市画像",
    },
  ];

  const matchedCity = cityImages.find((city) =>
    city.keywords.some((keyword) =>
      location.includes(keyword)
    )
  );

  if (matchedCity) {
    return {
      src: matchedCity.src,
      label: matchedCity.label,
      isDefault: false,
    };
  }

  return {
    src: defaultImage,
    label: "デフォルト画像",
    isDefault: true,
  };
}