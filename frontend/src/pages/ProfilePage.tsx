
// Reactの状態管理・初回処理に使用する機能
import { useEffect, useState, type ChangeEvent } from "react";

// React Routerからページ移動に使う機能を読み込む
import { useNavigate } from "react-router-dom";
import "./ProfilePages.css";

// プロフィール情報の型
interface UserProfile {
  // ユーザーID
  id: number;

  // 他のユーザーに表示する名前
  nickname: string;

  // 好きなポケモン（旧形式との互換性のため残す）
  favorite_pokemon: string | null;

  // 好きなポケモンの一覧
  favorite_pokemon_list?: string[] | null;

  // 使用する言語
  language: string | null;

  // 自己紹介
  introduction: string | null;

  // 性別と公開設定
  gender?: string | null;
  is_gender_public?: boolean;

  // フレンドコードと公開設定
  friend_code?: string | null;
  is_friend_code_public?: boolean;

  // プロフィール全体の公開設定
  is_profile_public?: boolean;

  // プロフィール画像の種類（プリセットまたはアップロード画像）
  avatar_type?: string | null;

  // 選択中のプリセットアイコン
  avatar_preset?: string | null;

  // アップロード画像のURL
  avatar_url?: string | null;

  // プレイしているゲームのslug一覧
  game_slugs?: string[] | null;

  // プレイスタイルのslug一覧
  play_style_slugs?: string[] | null;
}

// プロフィール更新APIのレスポンス
interface UpdateResponse {
  // 更新成功時のメッセージ
  message?: string;

  // エラー時のメッセージ
  detail?: string;
}

// プロフィール公開設定APIのレスポンス
interface VisibilityResponse {
  message?: string;
  detail?: string;
  is_profile_public?: boolean;
}

// プロフィール画像アップロードAPIのレスポンス
interface AvatarUploadResponse {
  message?: string;
  detail?: string;
  avatar_type?: string;
  avatar_url?: string;
}

// プロフィール画像のプリセット一覧
// 絵文字ではなく画像を使い、ポケモンごとの見た目を統一する。
// 画像URLはPokeAPI spritesリポジトリの画像を使用している。
const AVATAR_PRESETS = [
  {
    value: "pokeball",
    label: "モンスターボール",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  },
  {
    value: "pikachu",
    label: "ピカチュウ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
  },
  {
    value: "eevee",
    label: "イーブイ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
  },
  {
    value: "venusaur",
    label: "フシギバナ",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
  },
  {
    value: "charizard",
    label: "リザードン",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
  },
  {
    value: "blastoise",
    label: "カメックス",
    imageUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
  },
] as const;

// プレイしているゲームの選択肢
// slugはバックエンドのpokemon_gamesテーブルに登録されている値を使う。
const GAME_OPTIONS = [
  { value: "pokemon-sv", label: "ポケモン スカーレット・バイオレット" },
  { value: "pokemon-go", label: "Pokémon GO" },
  { value: "pokemon-sleep", label: "Pokémon Sleep" },
  { value: "pokemon-tcg-pocket", label: "Pokémon TCG Pocket" },
  { value: "pokemon-legends-za", label: "Pokémon LEGENDS Z-A" },
  { value: "pokemon-unite", label: "Pokémon UNITE" },
  { value: "pokemon-masters-ex", label: "Pokémon Masters EX" },
] as const;

// プレイスタイルの選択肢
// slugはバックエンドのplay_stylesテーブルに登録されている値を使う。
const PLAY_STYLE_OPTIONS = [
  { value: "battle", label: "対戦" },
  { value: "trading", label: "ポケモン交換" },
  { value: "co-op", label: "協力プレイ" },
  { value: "raids", label: "レイド" },
  { value: "pokedex", label: "図鑑完成" },
  { value: "shiny-hunting", label: "色違い厳選" },
  { value: "pokemon-go-walking", label: "ポケモンGOの散歩" },
  { value: "casual", label: "のんびりプレイ" },
] as const;

// 性別の選択肢
const GENDER_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "男性", label: "男性" },
  { value: "女性", label: "女性" },
  { value: "その他", label: "その他" },
  { value: "回答しない", label: "回答しない" },
] as const;

// FastAPIのベースURL
const API_BASE_URL = "http://127.0.0.1:8000";

// プリセット名から画像URLを取得する
function getAvatarPresetImageUrl(
  preset: string | null | undefined,
): string {
  return (
    AVATAR_PRESETS.find((item) => item.value === preset)?.imageUrl ??
    AVATAR_PRESETS[0].imageUrl
  );
}

// プリセット名から表示名を取得する
function getAvatarPresetLabel(
  preset: string | null | undefined,
): string {
  return (
    AVATAR_PRESETS.find((item) => item.value === preset)?.label ??
    AVATAR_PRESETS[0].label
  );
}

// 画像URLが相対パスの場合はFastAPIのURLを付ける
function getAvatarImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

// 好きなポケモン一覧を安全に取得する。
// 新しいAPIの一覧が空の場合は、旧形式のfavorite_pokemonも利用する。
function getFavoritePokemonList(data: UserProfile): string[] {
  if (
    Array.isArray(data.favorite_pokemon_list) &&
    data.favorite_pokemon_list.length > 0
  ) {
    return data.favorite_pokemon_list;
  }

  return data.favorite_pokemon ? [data.favorite_pokemon] : [];
}

// マイプロフィール画面
function ProfilePage() {
  // 現在のユーザー情報
  const [user, setUser] = useState<UserProfile | null>(null);

  // プロフィール取得中かどうか
  const [isLoading, setIsLoading] = useState(true);

  // ニックネーム入力用
  const [nickname, setNickname] = useState("");

  // 好きなポケモン入力用（複数選択）
  const [favoritePokemonList, setFavoritePokemonList] = useState<string[]>(
    [],
  );

  // 好きなポケモンの追加入力用
  const [favoritePokemonInput, setFavoritePokemonInput] = useState("");

  // 言語入力用
  const [language, setLanguage] = useState("");

  // 性別入力用
  const [gender, setGender] = useState("");

  // 性別を公開するかどうか
  const [isGenderPublic, setIsGenderPublic] = useState(false);

  // フレンドコード入力用
  const [friendCode, setFriendCode] = useState("");

  // フレンドコードを公開するかどうか
  const [isFriendCodePublic, setIsFriendCodePublic] = useState(false);

  // 自己紹介入力用
  const [introduction, setIntroduction] = useState("");

  // プレイしているゲーム
  const [gameSlugs, setGameSlugs] = useState<string[]>([]);

  // プレイスタイル
  const [playStyleSlugs, setPlayStyleSlugs] = useState<string[]>([]);

  // メッセージ表示用
  const [message, setMessage] = useState("");

  // 編集モードかどうか
  const [isEditing, setIsEditing] = useState(false);

  // 保存中かどうか
  const [isSaving, setIsSaving] = useState(false);

  // プロフィールを公開するかどうか
  // nullは、公開設定をまだ取得できていない状態を表す。
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null);

  // 公開設定の保存中かどうか
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // アップロードする画像ファイル
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );

  // 選択した画像のプレビューURL
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

  // 画像アップロード中かどうか
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // プリセットアイコンの保存中かどうか
  const [isSavingAvatarPreset, setIsSavingAvatarPreset] = useState(false);

  // 選択中のプリセットアイコン
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState("pokeball");

  // プリセットアイコンの保存結果を、ボタンの近くに表示する
  const [avatarPresetMessage, setAvatarPresetMessage] = useState("");

  // プリセットを選び直したかどうか
  const [isPresetSelection, setIsPresetSelection] = useState(false);

  // ページ移動に使用する
  const navigate = useNavigate();

  // 自分のプロフィールを取得する関数
  const getMyProfile = async (): Promise<void> => {
    // localStorageからJWTを取得
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      setIsLoading(false);
      return;
    }

    try {
      // FastAPIのプロフィール取得APIへアクセス
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // FastAPIから返されたJSONを取得
      const data: UserProfile & { detail?: string } = await response.json();

      // エラーの場合
      if (!response.ok) {
        setMessage(data.detail || "プロフィールの取得に失敗しました");
        return;
      }

      // プロフィール情報を保存
      setUser(data);

      // 現在のプリセットアイコンを選択状態にする
      setSelectedAvatarPreset(data.avatar_preset || "pokeball");
      setIsPresetSelection(false);

      // 編集フォームにも現在の値を設定
      setNickname(data.nickname || "");
      setFavoritePokemonList(getFavoritePokemonList(data));
      setFavoritePokemonInput("");
      setLanguage(data.language || "");
      setGender(data.gender || "");
      setIsGenderPublic(data.is_gender_public ?? false);
      setFriendCode(data.friend_code || "");
      setIsFriendCodePublic(data.is_friend_code_public ?? false);
      setIntroduction(data.introduction || "");
      setGameSlugs(Array.isArray(data.game_slugs) ? data.game_slugs : []);
      setPlayStyleSlugs(
        Array.isArray(data.play_style_slugs) ? data.play_style_slugs : [],
      );

      // プロフィール公開設定を取得する
      const visibilityResponse = await fetch(
        `${API_BASE_URL}/me/profile-visibility`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // 公開設定APIから返されたJSON
      const visibilityData: VisibilityResponse =
        await visibilityResponse.json();

      // 公開設定の取得に成功し、boolean値が返された場合
      if (
        visibilityResponse.ok &&
        typeof visibilityData.is_profile_public === "boolean"
      ) {
        setIsProfilePublic(visibilityData.is_profile_public);
      } else {
        // 取得できていない場合は、誤って「公開」を初期選択しない。
        setIsProfilePublic(null);
        setMessage(
          visibilityData.detail || "公開設定の取得に失敗しました。ページを再読み込みしてください。",
        );
      }
    } catch (error) {
      // 通信エラー
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ページを開いたときにプロフィールを取得
  useEffect(() => {
    void getMyProfile();

    // 初回表示時のみ取得する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // プレビュー用に作成した一時URLを解放する
  // ファイルを選び直したときやページを離れたときに、不要になったObject URLを解放する。
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // 選択した画像ファイルを確認し、プレビューを表示する
  const handleAvatarFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0] ?? null;

    // ファイル選択がキャンセルされた場合
    if (!file) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      return;
    }

    // バックエンドと同じ5MB制限を事前に確認する
    if (file.size > 5 * 1024 * 1024) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setMessage("画像サイズは5MB以下にしてください");
      event.target.value = "";
      return;
    }

    // 対応している画像形式だけを受け付ける
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setMessage("JPEG・PNG・WebP形式の画像を選択してください");
      event.target.value = "";
      return;
    }

    // 選択したファイルを保存し、プレビュー用URLを作る
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setIsPresetSelection(false);
    setMessage("");

    // 同じファイルを再度選択した場合もchangeイベントが発生するようにする
    event.target.value = "";
  };

  // 選択した画像をプロフィール画像としてアップロードする
  const handleAvatarUpload = async (): Promise<void> => {
    // JWTを取得
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      return;
    }

    // 画像が選択されていない場合
    if (!selectedAvatarFile) {
      setMessage("アップロードする画像を選択してください");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setMessage("");

      // ファイルアップロードではFormDataを使用する
      const formData = new FormData();
      formData.append("file", selectedAvatarFile);

      // Content-Typeは手動設定しない。ブラウザがmultipart/form-dataの境界情報を設定する。
      const response = await fetch(`${API_BASE_URL}/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: AvatarUploadResponse = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "プロフィール画像のアップロードに失敗しました",
        );
        return;
      }

      // アップロード成功後、選択中のファイルをクリアする
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setIsPresetSelection(false);
      setMessage(data.message || "プロフィール画像をアップロードしました");

      // 最新のプロフィール情報を取得する
      await getMyProfile();
    } catch (error) {
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 選択したプリセットアイコンをプロフィールに設定する
  const handleAvatarPresetUpdate = async (
    preset: string,
  ): Promise<void> => {
    // JWTを取得
    const token = localStorage.getItem("access_token");

    if (!token) {
      setAvatarPresetMessage("ログインしてください");
      return;
    }

    if (!user) {
      setAvatarPresetMessage("プロフィール情報を取得してください");
      return;
    }

    try {
      setIsSavingAvatarPreset(true);
      setAvatarPresetMessage("アイコンを保存しています...");
      setMessage("");

      // UserUpdateではnicknameが必須なので、現在の値も送信する。
      // ほかのプロフィール項目は送信せず、アイコンだけを更新する。
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: user.nickname,
          avatar_preset: preset,
        }),
      });

      const data: UpdateResponse = await response.json();

      if (!response.ok) {
        setAvatarPresetMessage(
          data.detail || "プロフィールアイコンの変更に失敗しました",
        );
        return;
      }

      setSelectedAvatarPreset(preset);
      setIsPresetSelection(false);
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");

      // 最新のプロフィール情報を取得する
      await getMyProfile();
      setAvatarPresetMessage(data.message || "プロフィールアイコンを変更しました");
    } catch (error) {
      console.error(error);
      setAvatarPresetMessage("通信エラーが発生しました。APIサーバーの状態を確認してください。");
    } finally {
      setIsSavingAvatarPreset(false);
    }
  };

  // 好きなポケモンを追加する
  const handleAddFavoritePokemon = (): void => {
    const names = favoritePokemonInput
      .split(/[、,，]/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return;
    }

    // 既に登録されているポケモンは重複登録しない
    const uniqueNames = names.filter(
      (name) =>
        !favoritePokemonList.some(
          (existingName) =>
            existingName.toLowerCase() === name.toLowerCase(),
        ),
    );

    setFavoritePokemonList((current) => [...current, ...uniqueNames]);
    setFavoritePokemonInput("");
  };

  // 好きなポケモンを一覧から削除する
  const handleRemoveFavoritePokemon = (pokemon: string): void => {
    setFavoritePokemonList((current) =>
      current.filter((name) => name !== pokemon),
    );
  };

  // ゲームやプレイスタイルの選択状態を切り替える
  const toggleStringOption = (
    value: string,
    currentValues: string[],
    setValues: (values: string[]) => void,
  ): void => {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value));
    } else {
      setValues([...currentValues, value]);
    }
  };

  // プロフィール更新処理
  const handleUpdate = async (): Promise<void> => {
    // JWTを取得
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      return;
    }

    try {
      // 保存中にする
      setIsSaving(true);

      // メッセージをクリア
      setMessage("");

      // FastAPIのプロフィール更新APIへアクセス
      const response = await fetch(`${API_BASE_URL}/me`, {
        // 更新なのでPUT
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        // 更新するプロフィール情報
        // login_idは送らない。login_idは変更できない設計。
        body: JSON.stringify({
          nickname: nickname.trim(),

          // 旧形式との互換性のため、最初のポケモンも送信する。
          favorite_pokemon: favoritePokemonList[0] || null,
          favorite_pokemon_list: favoritePokemonList,

          language: language.trim() || null,
          introduction: introduction.trim() || null,

          gender: gender || null,
          is_gender_public: isGenderPublic,

          friend_code: friendCode.trim() || null,
          is_friend_code_public: isFriendCodePublic,

          game_slugs: gameSlugs,
          play_style_slugs: playStyleSlugs,
        }),
      });

      // FastAPIから返されたJSON
      const data: UpdateResponse = await response.json();

      // 更新失敗
      if (!response.ok) {
        setMessage(data.detail || "プロフィールの更新に失敗しました");
        return;
      }

      // 更新成功
      setMessage(data.message || "プロフィールを更新しました");

      // 編集モードを終了
      setIsEditing(false);

      // 最新プロフィールを再取得
      await getMyProfile();
    } catch (error) {
      // 通信エラー
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      // 保存中を解除
      setIsSaving(false);
    }
  };

  // プロフィール公開設定の更新処理
  // 「公開する」「非公開にする」を選んだ時点で、指定された値を保存する。
  const handleVisibilityUpdate = async (
    requestedVisibility: boolean,
  ): Promise<void> => {
    // JWTを取得
    const token = localStorage.getItem("access_token");

    // JWTがない場合
    if (!token) {
      setMessage("ログインしてください");
      return;
    }

    // 公開設定を取得できていない場合は保存しない。
    if (isProfilePublic === null) {
      setMessage("公開設定を取得できていません。ページを再読み込みしてください。");
      return;
    }

    // すでに保存されている設定と同じ場合は、APIを呼び出さない。
    if (requestedVisibility === isProfilePublic) {
      return;
    }

    try {
      // 保存中にする
      setIsSavingVisibility(true);

      // 保存中であることを画面に表示する
      setMessage("公開設定を更新しています...");

      // FastAPIの公開設定更新APIへアクセス
      const response = await fetch(
        `${API_BASE_URL}/me/profile-visibility`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          // 更新する公開設定
          body: JSON.stringify({
            is_profile_public: requestedVisibility,
          }),
        },
      );

      // FastAPIから返されたJSON
      const data: VisibilityResponse = await response.json();

      // 更新失敗
      if (!response.ok) {
        setMessage(data.detail || "公開設定の更新に失敗しました");
        return;
      }

      // PUT成功時の値をいったん反映する。
      setIsProfilePublic(
        typeof data.is_profile_public === "boolean"
          ? data.is_profile_public
          : requestedVisibility,
      );

      // 保存後にGETでもう一度取得し、DBに保存された値を確認する。
      const verifyResponse = await fetch(
        `${API_BASE_URL}/me/profile-visibility`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const verifyData: VisibilityResponse = await verifyResponse.json();

      // 保存後の確認ができなかった場合
      if (
        !verifyResponse.ok ||
        typeof verifyData.is_profile_public !== "boolean"
      ) {
        setMessage(
          "公開設定は更新されましたが、保存状態を再確認できませんでした。ページを再読み込みして確認してください。",
        );
        return;
      }

      // GETで取得した値を画面に反映する。
      setIsProfilePublic(verifyData.is_profile_public);

      // 選択した値と保存後の値が一致するか確認する。
      if (verifyData.is_profile_public !== requestedVisibility) {
        setMessage(
          "保存後の確認で選択内容と異なる設定が返されました。ページを再読み込みして確認してください。",
        );
        return;
      }

      setMessage(
        requestedVisibility
          ? "プロフィールを公開に変更しました。"
          : "プロフィールを非公開に変更しました。",
      );
    } catch (error) {
      // 通信エラー
      console.error(error);
      setMessage("通信エラーが発生しました");
    } finally {
      // 保存中を解除
      setIsSavingVisibility(false);
    }
  };

  // 編集をキャンセルする処理
  const handleCancel = (): void => {
    // 現在保存されているプロフィールの値に戻す
    if (user) {
      setNickname(user.nickname);
      setFavoritePokemonList(getFavoritePokemonList(user));
      setFavoritePokemonInput("");
      setLanguage(user.language || "");
      setGender(user.gender || "");
      setIsGenderPublic(user.is_gender_public ?? false);
      setFriendCode(user.friend_code || "");
      setIsFriendCodePublic(user.is_friend_code_public ?? false);
      setIntroduction(user.introduction || "");
      setGameSlugs(Array.isArray(user.game_slugs) ? user.game_slugs : []);
      setPlayStyleSlugs(
        Array.isArray(user.play_style_slugs) ? user.play_style_slugs : [],
      );
      setSelectedAvatarPreset(user.avatar_preset || "pokeball");
    }

    setSelectedAvatarFile(null);
    setAvatarPreviewUrl("");
    setIsPresetSelection(false);

    // 編集モード終了
    setIsEditing(false);

    // メッセージをクリア
    setMessage("");
  };

  // プロフィール画像表示用のURLを決める
  const getCurrentAvatarContent = () => {
    if (avatarPreviewUrl && selectedAvatarFile) {
      return (
        <img
          className="pm-avatar-image"
          src={avatarPreviewUrl}
          alt="選択した画像のプレビュー"
        />
      );
    }

    if (
      isPresetSelection ||
      user?.avatar_type !== "upload" ||
      !user?.avatar_url
    ) {
      return (
        <img
          className="pm-avatar-image pm-avatar-preset-image"
          src={getAvatarPresetImageUrl(selectedAvatarPreset)}
          alt={getAvatarPresetLabel(selectedAvatarPreset)}
        />
      );
    }

    return (
      <img
        className="pm-avatar-image"
        src={getAvatarImageUrl(user.avatar_url)}
        alt={`${user.nickname}のプロフィール画像`}
      />
    );
  };

  return (
    <main className="pm-profile-page">
      {/* アプリのタイトルとページタイトル */}
      <header className="pm-page-heading">
        <p className="pm-eyebrow">POKEMEET / MY PROFILE</p>
        <h1>マイプロフィール</h1>
        <p>プロフィール情報と公開範囲を設定できます。</p>
      </header>

      {/* メッセージ */}
      {message && (
        <p className="pm-message" role="status">
          {message}
        </p>
      )}

      {isLoading && (
        <section className="pm-card pm-empty-state">
          <p>プロフィールを読み込んでいます...</p>
        </section>
      )}

      {/* プロフィールが取得できた場合 */}
      {user && (
        <>
          {/* 表示モード */}
          {!isEditing && (
            <>
              <section className="pm-card pm-profile-hero">
                <div className="pm-avatar">
                  {user.avatar_type === "upload" && user.avatar_url ? (
                    <img
                      className="pm-avatar-image"
                      src={getAvatarImageUrl(user.avatar_url)}
                      alt={`${user.nickname}のプロフィール画像`}
                    />
                  ) : (
                    <img
                      className="pm-avatar-image pm-avatar-preset-image"
                      src={getAvatarPresetImageUrl(user.avatar_preset)}
                      alt={getAvatarPresetLabel(user.avatar_preset)}
                    />
                  )}
                </div>

                <div className="pm-profile-hero-text">
                  <p className="pm-eyebrow">POKEMEET TRAINER</p>
                  <h2>{user.nickname}</h2>
                  <p className="pm-muted">トレーナー ID：{user.id}</p>

                  <div className="pm-profile-hero-tags">
                    {user.gender && user.is_gender_public && (
                      <span className="pm-tag">{user.gender}</span>
                    )}

                    {user.language && (
                      <span className="pm-tag">{user.language}</span>
                    )}
                  </div>
                </div>

                {/* 編集ボタン */}
                <button
                  className="pm-button pm-button-primary"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  プロフィールを編集
                </button>
              </section>

              {/* プロフィール情報 */}
              <section className="pm-profile-info-grid">
                <article className="pm-card pm-info-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    ⭐
                  </span>
                  <p className="pm-info-label">好きなポケモン</p>

                  {getFavoritePokemonList(user).length > 0 ? (
                    <div className="pm-chip-list">
                      {getFavoritePokemonList(user).map((pokemon) => (
                        <span className="pm-chip" key={pokemon}>
                          {pokemon}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="pm-muted">未設定</p>
                  )}
                </article>

                <article className="pm-card pm-info-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    🎮
                  </span>
                  <p className="pm-info-label">プレイしているゲーム</p>

                  {user.game_slugs && user.game_slugs.length > 0 ? (
                    <div className="pm-chip-list">
                      {user.game_slugs.map((slug) => (
                        <span className="pm-chip" key={slug}>
                          {GAME_OPTIONS.find((item) => item.value === slug)
                            ?.label || slug}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="pm-muted">未設定</p>
                  )}
                </article>

                <article className="pm-card pm-info-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    🤝
                  </span>
                  <p className="pm-info-label">プレイスタイル</p>

                  {user.play_style_slugs && user.play_style_slugs.length > 0 ? (
                    <div className="pm-chip-list">
                      {user.play_style_slugs.map((slug) => (
                        <span className="pm-chip" key={slug}>
                          {PLAY_STYLE_OPTIONS.find(
                            (item) => item.value === slug,
                          )?.label || slug}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="pm-muted">未設定</p>
                  )}
                </article>

                <article className="pm-card pm-info-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    👤
                  </span>
                  <p className="pm-info-label">性別</p>

                  {user.gender ? (
                    <>
                      <h3>{user.gender}</h3>
                      <p className="pm-muted">
                        {user.is_gender_public ? "公開" : "非公開"}
                      </p>
                    </>
                  ) : (
                    <p className="pm-muted">未設定</p>
                  )}
                </article>

                <article className="pm-card pm-info-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    🔑
                  </span>
                  <p className="pm-info-label">フレンドコード</p>

                  {user.friend_code ? (
                    <>
                      <h3 className="pm-friend-code">{user.friend_code}</h3>
                      <p className="pm-muted">
                        {user.is_friend_code_public
                          ? "他のユーザーに公開中"
                          : "非公開設定（他のユーザーには表示されません）"}
                      </p>
                    </>
                  ) : (
                    <p className="pm-muted">未設定</p>
                  )}
                </article>

                <article className="pm-card pm-info-card pm-introduction-card">
                  <span className="pm-info-icon" aria-hidden="true">
                    💬
                  </span>
                  <p className="pm-info-label">自己紹介</p>

                  {user.introduction ? (
                    <p className="pm-introduction">{user.introduction}</p>
                  ) : (
                    <p className="pm-muted">自己紹介はまだありません。</p>
                  )}
                </article>
              </section>
            </>
          )}

          {/* 編集モード */}
          {isEditing && (
            <section className="pm-card">
              <div className="pm-section-heading">
                <h2>プロフィール編集</h2>
                <p className="pm-muted">
                  他のユーザーに表示する情報を編集できます。
                </p>
              </div>

              <div className="pm-profile-form">
                {/* プロフィール画像 */}
                <section className="pm-avatar-editor">
                  <div className="pm-section-heading">
                    <h3>プロフィール画像</h3>
                    <p className="pm-muted">
                      画像をアップロードするか、ポケモンのプリセット画像を選択できます。
                    </p>
                  </div>

                  <div className="pm-avatar-editor-main">
                    <div className="pm-avatar pm-avatar-editor-preview">
                      {getCurrentAvatarContent()}
                    </div>

                    <div className="pm-avatar-editor-controls">
                      <label className="pm-upload-dropzone">
                        <input
                          className="pm-file-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarFileChange}
                        />

                        <span className="pm-upload-icon" aria-hidden="true">
                          ↑
                        </span>

                        <span className="pm-upload-title">
                          {selectedAvatarFile
                            ? "別の画像を選択"
                            : "画像を選択"}
                        </span>

                        <span className="pm-upload-filename">
                          {selectedAvatarFile
                            ? selectedAvatarFile.name
                            : "JPEG・PNG・WebP／5MB以下"}
                        </span>
                      </label>

                      <div className="pm-actions">
                        <button
                          className="pm-button pm-button-primary"
                          type="button"
                          onClick={() => void handleAvatarUpload()}
                          disabled={!selectedAvatarFile || isUploadingAvatar}
                        >
                          {isUploadingAvatar
                            ? "アップロード中..."
                            : "画像をアップロード"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pm-avatar-presets">
                    <p className="pm-info-label">プリセットアイコン</p>

                    <div className="pm-avatar-preset-list">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          className={`pm-avatar-preset ${
                            selectedAvatarPreset === preset.value
                              ? "is-selected"
                              : ""
                          }`}
                          type="button"
                          aria-pressed={
                            selectedAvatarPreset === preset.value
                          }
                          onClick={() => {
                            setSelectedAvatarPreset(preset.value);
                            setIsPresetSelection(true);
                            setSelectedAvatarFile(null);
                            setAvatarPreviewUrl("");
                            setAvatarPresetMessage("");
                          }}
                          disabled={isSavingAvatarPreset || isUploadingAvatar}
                        >
                          <img
                            className="pm-avatar-preset-image"
                            src={preset.imageUrl}
                            alt=""
                            loading="lazy"
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      className="pm-button pm-button-secondary"
                      type="button"
                      onClick={() =>
                        void handleAvatarPresetUpdate(selectedAvatarPreset)
                      }
                      disabled={
                        isSavingAvatarPreset ||
                        isUploadingAvatar ||
                        (user?.avatar_type !== "upload" &&
                          user?.avatar_preset === selectedAvatarPreset)
                      }
                    >
                      {isSavingAvatarPreset
                        ? "保存中..."
                        : user?.avatar_type !== "upload" &&
                            user?.avatar_preset === selectedAvatarPreset
                          ? "現在設定中"
                          : "選択したアイコンを設定"}
                    </button>

                    {avatarPresetMessage && (
                      <p className="pm-message" role="status" aria-live="polite">
                        {avatarPresetMessage}
                      </p>
                    )}
                  </div>
                </section>

                {/* ニックネーム */}
                <label className="pm-form-field">
                  ニックネーム
                  <input
                    type="text"
                    value={nickname}
                    maxLength={50}
                    onChange={(event) => setNickname(event.target.value)}
                    required
                  />
                </label>

                {/* 好きなポケモン（複数追加可能） */}
                <section className="pm-form-section">
                  <div className="pm-form-section-heading">
                    <h3>好きなポケモン</h3>
                    <p className="pm-muted">
                      複数登録できます。名前を入力して追加してください。
                    </p>
                  </div>

                  <div className="pm-favorite-pokemon-input-row">
                    <input
                      className="pm-text-input"
                      type="text"
                      value={favoritePokemonInput}
                      placeholder="例：ピカチュウ、カメックス"
                      onChange={(event) =>
                        setFavoritePokemonInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddFavoritePokemon();
                        }
                      }}
                    />

                    <button
                      className="pm-button pm-button-secondary"
                      type="button"
                      onClick={handleAddFavoritePokemon}
                    >
                      追加
                    </button>
                  </div>

                  <div className="pm-chip-list pm-edit-chip-list">
                    {favoritePokemonList.length > 0 ? (
                      favoritePokemonList.map((pokemon) => (
                        <span
                          className="pm-chip pm-chip-removable"
                          key={pokemon}
                        >
                          {pokemon}
                          <button
                            type="button"
                            aria-label={`${pokemon}を削除`}
                            onClick={() =>
                              handleRemoveFavoritePokemon(pokemon)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="pm-muted">まだ登録されていません。</p>
                    )}
                  </div>
                </section>

                {/* 性別と公開設定 */}
                <section className="pm-form-section">
                  <div className="pm-form-section-heading">
                    <h3>性別</h3>
                    <p className="pm-muted">
                      性別を設定した場合も、公開するかどうかを選べます。
                    </p>
                  </div>

                  <label className="pm-form-field">
                    性別
                    <select
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="pm-inline-checkbox">
                    <input
                      type="checkbox"
                      checked={isGenderPublic}
                      onChange={(event) =>
                        setIsGenderPublic(event.target.checked)
                      }
                    />
                    <span>性別を他のユーザーに公開する</span>
                  </label>
                </section>

                {/* フレンドコードと公開設定 */}
                <section className="pm-form-section">
                  <div className="pm-form-section-heading">
                    <h3>フレンドコード</h3>
                    <p className="pm-muted">
                      交換やゲーム内の交流に使うコードを登録できます。
                    </p>
                  </div>

                  <label className="pm-form-field">
                    フレンドコード
                    <input
                      type="text"
                      value={friendCode}
                      maxLength={100}
                      placeholder="フレンドコードを入力"
                      onChange={(event) =>
                        setFriendCode(event.target.value)
                      }
                    />
                  </label>

                  <label className="pm-inline-checkbox">
                    <input
                      type="checkbox"
                      checked={isFriendCodePublic}
                      onChange={(event) =>
                        setIsFriendCodePublic(event.target.checked)
                      }
                    />
                    <span>フレンドコードを他のユーザーに公開する</span>
                  </label>
                </section>

                {/* 言語 */}
                <label className="pm-form-field">
                  言語
                  <input
                    type="text"
                    value={language}
                    placeholder="例：日本語、中国語"
                    onChange={(event) => setLanguage(event.target.value)}
                  />
                </label>

                {/* 自己紹介 */}
                <label className="pm-form-field">
                  自己紹介
                  <textarea
                    rows={5}
                    maxLength={1000}
                    value={introduction}
                    placeholder="好きなポケモンや、交流したいことを書いてみましょう。"
                    onChange={(event) =>
                      setIntroduction(event.target.value)
                    }
                  />
                </label>

                {/* プレイしているゲーム */}
                <section className="pm-form-section">
                  <div className="pm-form-section-heading">
                    <h3>プレイしているゲーム</h3>
                    <p className="pm-muted">
                      当てはまるゲームを複数選択できます。
                    </p>
                  </div>

                  <div className="pm-option-grid">
                    {GAME_OPTIONS.map((option) => (
                      <label
                        className="pm-option-card"
                        key={option.value}
                      >
                        <input
                          type="checkbox"
                          checked={gameSlugs.includes(option.value)}
                          onChange={() =>
                            toggleStringOption(
                              option.value,
                              gameSlugs,
                              setGameSlugs,
                            )
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* プレイスタイル */}
                <section className="pm-form-section">
                  <div className="pm-form-section-heading">
                    <h3>プレイスタイル</h3>
                    <p className="pm-muted">
                      どのような遊び方が好きか選んでください。
                    </p>
                  </div>

                  <div className="pm-option-grid">
                    {PLAY_STYLE_OPTIONS.map((option) => (
                      <label
                        className="pm-option-card"
                        key={option.value}
                      >
                        <input
                          type="checkbox"
                          checked={playStyleSlugs.includes(option.value)}
                          onChange={() =>
                            toggleStringOption(
                              option.value,
                              playStyleSlugs,
                              setPlayStyleSlugs,
                            )
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* 保存・キャンセルボタン */}
                <div className="pm-actions">
                  <button
                    className="pm-button pm-button-primary"
                    type="button"
                    onClick={() => void handleUpdate()}
                    disabled={isSaving || !nickname.trim()}
                  >
                    {isSaving ? "保存中..." : "プロフィールを保存する"}
                  </button>

                  <button
                    className="pm-button pm-button-secondary"
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* プロフィールの公開設定 */}
          <section className="pm-card pm-visibility-card">
            <div className="pm-section-heading">
              <h2>公開設定</h2>
              <p className="pm-muted">
                ユーザー一覧やプロフィール詳細での表示範囲を設定します。
              </p>
            </div>

            {/* 現在の公開設定を表示する */}
            {isProfilePublic === null ? (
              <div className="pm-visibility-current" role="status">
                <span className="pm-visibility-status is-private">
                  設定を取得できません
                </span>
                <p>
                  公開設定を読み込めないため、選択できません。
                  ページを再読み込みしてください。
                </p>
              </div>
            ) : (
              <>
                <div className="pm-visibility-current">
                  <span
                    className={`pm-visibility-status ${
                      isProfilePublic ? "is-public" : "is-private"
                    }`}
                  >
                    現在：{isProfilePublic ? "公開" : "非公開"}
                  </span>
                  <p>
                    「公開する」「非公開にする」を選ぶと、その設定がすぐに保存されます。
                  </p>
                </div>

                {/* 公開・非公開をカード形式で選択する */}
                <div
                  className="pm-visibility-options"
                  role="radiogroup"
                  aria-label="プロフィールの公開範囲"
                >
                  <label
                    className={`pm-visibility-choice ${
                      isProfilePublic ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="public"
                      checked={isProfilePublic === true}
                      onChange={() => void handleVisibilityUpdate(true)}
                      disabled={isSavingVisibility}
                    />
                    <span className="pm-visibility-choice-icon" aria-hidden="true">
                      🌐
                    </span>
                    <span className="pm-visibility-copy">
                      <strong>公開する</strong>
                      <span>
                        他の一般ユーザーの一覧に表示され、プロフィール詳細も閲覧できるようになります。
                      </span>
                      <em>他のユーザーとの交流を広げたい方向け</em>
                    </span>
                    <span className="pm-visibility-choice-mark">
                      {isSavingVisibility && isProfilePublic !== true
                        ? "保存中..."
                        : isProfilePublic
                          ? "選択中"
                          : "選択する"}
                    </span>
                  </label>

                  <label
                    className={`pm-visibility-choice ${
                      !isProfilePublic ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="private"
                      checked={isProfilePublic === false}
                      onChange={() => void handleVisibilityUpdate(false)}
                      disabled={isSavingVisibility}
                    />
                    <span className="pm-visibility-choice-icon" aria-hidden="true">
                      🔒
                    </span>
                    <span className="pm-visibility-copy">
                      <strong>非公開にする</strong>
                      <span>
                        他の一般ユーザーの一覧に表示されず、プロフィール詳細も閲覧できなくなります。
                      </span>
                      <em>自分のプロフィールを他のユーザーに見せたくない方向け</em>
                    </span>
                    <span className="pm-visibility-choice-mark">
                      {isSavingVisibility && isProfilePublic !== false
                        ? "保存中..."
                        : !isProfilePublic
                          ? "選択中"
                          : "選択する"}
                    </span>
                  </label>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* ユーザー一覧へ戻る */}
      <div className="pm-page-footer">
        <button
          className="pm-button pm-button-secondary"
          type="button"
          onClick={() => navigate("/users")}
        >
          ← ユーザー一覧に戻る
        </button>
      </div>
    </main>
  );
}

// 他のファイルから使用できるようにする
export default ProfilePage;
