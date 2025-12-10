// src/config/swagger.ts
import { OpenAPIV3 } from "openapi-types";

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "UFC Fighters API",
    description:
      "UFC dövüşçülerini, favorileri ve UFC eventlerini yöneten REST API.\n\n" +
      "- Fighters: Octagon API'den dövüşçü çekme, listeleme, manuel ekleme/güncelleme/silme.\n" +
      "- Favorites: Kullanıcıya özel favori dövüşçü listesi yönetimi (JWT ile korumalı).\n" +
      "- UFC Events: UFC sitesinden upcoming/past event header'larını ve event fight card (fights[]) detaylarını scrape edip MongoDB'de saklama.",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:5050",
      description: "Local development server",
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Fighter: {
        type: "object",
        properties: {
          _id: { type: "string", description: "MongoDB internal id" },
          externalId: {
            type: "string",
            example: "islam-makhachev",
            description: "Octagon API slug/id (public fighter ID). Örn: islam-makhachev",
          },
          name: { type: "string", example: "Conor McGregor" },
          nickname: { type: "string", example: "The Notorious" },
          weightClass: { type: "string", example: "Lightweight" },
          country: { type: "string", example: "Ireland" },
          wins: { type: "number", example: 22 },
          losses: { type: "number", example: 6 },
          draws: { type: "number", example: 0 },
          status: { type: "string", example: "Active" },
          imageUrl: {
            type: "string",
            example: "https://example.com/conor.png",
          },
          createdAt: {
            type: "string",
            example: "21.11.2025 14:52:25",
            description: "Sunucu tarafında tr-TR locale ile formatlanmış tarih/saat.",
          },
          updatedAt: {
            type: "string",
            example: "21.11.2025 14:52:25",
            description: "Sunucu tarafında tr-TR locale ile formatlanmış tarih/saat.",
          },
        },
        required: ["externalId", "name", "weightClass"],
      },

      Favorite: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Favorite MongoDB id" },
          fighter: {
            $ref: "#/components/schemas/Fighter",
          },
          note: { type: "string", example: "En sevdiğim striker" },
          createdAt: {
            type: "string",
            example: "21.11.2025 15:42:52",
            description: "tr-TR locale string",
          },
          updatedAt: {
            type: "string",
            example: "21.11.2025 15:42:52",
            description: "tr-TR locale string",
          },
        },
      },

      // 🟡 UFC Events şeması (header)
      UfcEvent: {
        type: "object",
        properties: {
          _id: { type: "string", description: "MongoDB internal id" },
          ufcId: {
            type: "string",
            example: "ufc-fight-night-december-13-2025",
            description:
              "UFC event slug/id (örn: ufc-312, ufc-fight-night-december-13-2025).",
          },
          name: { type: "string", example: "Royval vs Kape" },
          subtitle: {
            type: "string",
            example: "Sat, Dec 13 / 10:00 PM EST",
          },
          date: {
            type: "string",
            format: "date-time",
            example: "2025-12-13T00:00:00.000Z",
          },
          location: {
            type: "string",
            example: "UFC APEX\nLas Vegas, NV\nUnited States",
          },
          type: {
            type: "string",
            example: "Event",
            description: "PPV | Fight Night | Event | Other",
          },
          isUpcoming: {
            type: "boolean",
            example: true,
            description:
              "true = upcoming (gelecek event), false = past (geçmiş event). Event listesi filtrelemede kullanılır.",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-11-21T14:52:25.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-11-21T14:52:25.000Z",
          },
        },
      },

      // 🥊 Tek maç satırı
      EventFight: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "ufc-fight-night-december-13-2025-1",
            description: "Event slug + boutOrder birleşimi (örn: ufc-312-1).",
          },
          boutOrder: {
            type: "integer",
            example: 1,
            description: "Event içindeki sıralama (1 = main event, en üstteki).",
          },
          weightClass: {
            type: "string",
            example: "Flyweight Bout",
          },

          // İsimler (red/blue köşe)
          redName: { type: "string", example: "Brandon Royval" },
          blueName: { type: "string", example: "Manel Kape" },
          redRank: { type: "integer", nullable: true, example: 3 },
          blueRank: { type: "integer", nullable: true, example: 6 },

          // Ülke + bayrak kodu (ülke adı her zaman “ülke” formatında tutulur)
          redCountry: {
            type: "string",
            nullable: true,
            example: "United States",
          },
          blueCountry: {
            type: "string",
            nullable: true,
            example: "Portugal",
          },
          redCountryCode: {
            type: "string",
            nullable: true,
            example: "US",
            description: "ISO bayrak kodu, UFC flag görselinden parse edilir.",
          },
          blueCountryCode: {
            type: "string",
            nullable: true,
            example: "PT",
            description: "ISO bayrak kodu, UFC flag görselinden parse edilir.",
          },

          // Bahis oranları (şu an opsiyonel / placeholder)
          redOdds: {
            type: "string",
            nullable: true,
            example: "-120",
          },
          blueOdds: {
            type: "string",
            nullable: true,
            example: "+105",
          },

          cardSection: {
            type: "string",
            nullable: true,
            enum: ["Main Card", "Prelims", "Early Prelims", "Unknown"],
            description: "Fight card bölümü (Main Card / Prelims / Early Prelims).",
          },
          isPlaceholder: {
            type: "boolean",
            nullable: true,
            description:
              "true ise hem redName hem blueName gerçek isim bulunamamış (TBD vs TBD placeholder).",
          },

          // 🔥 YENİ – sadece geçmiş event’lerde dolu
          fightBonus: {
            type: "string",
            nullable: true,
            example: "Fight of the Night",
            description:
              "Bonus ödül metni: 'Fight of the Night', 'Performance of the Night' vb. Sadece past eventlerde set edilir.",
          },
          resultRound: {
            type: "integer",
            nullable: true,
            example: 3,
            description: "Maçın bittiği raund (sadece geçmiş eventlerde dolu).",
          },
          resultMethod: {
            type: "string",
            nullable: true,
            example: "KO/TKO",
            description:
              "Maç sonucu: KO/TKO, Submission, Decision - Unanimous, Majority Draw vb.",
          },
          winnerSide: {
            type: "string",
            nullable: true,
            enum: ["red", "blue", "draw", "no-contest"],
            example: "blue",
            description:
              "Hangi köşe kazandı: red | blue | draw | no-contest. Sadece sonuçlanmış (past) maçlarda set edilir.",
          },
        },
      },

      // 🧩 Event + fights birleşik şema
      EventWithFights: {
        allOf: [
          { $ref: "#/components/schemas/UfcEvent" },
          {
            type: "object",
            properties: {
              fights: {
                type: "array",
                items: { $ref: "#/components/schemas/EventFight" },
              },
              lastDetailsRefreshedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                description:
                  "Bu event için UFC detail sayfasından fights[] verisinin en son ne zaman scrape edildiği.",
              },
            },
          },
        ],
      },

      // 🥋 UFC Rankings şemaları
      FighterRank: {
        type: "object",
        properties: {
          rank: {
            type: "integer",
            nullable: true,
            description: "Rank numarası (1, 2, 3... veya champion için 0)",
          },
          rankText: {
            type: "string",
            nullable: true,
            description: "Rank metni ('C', '1', '2'...)",
          },
          isChampion: {
            type: "boolean",
            description: "Şampiyon mu?",
          },
          name: {
            type: "string",
            description: "Dövüşçü adı",
          },
        },
        required: ["isChampion", "name"],
      },

      Division: {
        type: "object",
        properties: {
          division: {
            type: "string",
            description: "Siklet adı (örn: 'Lightweight')",
          },
          champion: {
            $ref: "#/components/schemas/FighterRank",
            nullable: true,
            description: "Şampiyon bilgisi",
          },
          fighters: {
            type: "array",
            items: { $ref: "#/components/schemas/FighterRank" },
            description: "Top 15 dövüşçü listesi",
          },
        },
        required: ["division", "fighters"],
      },
    },
  },

  paths: {
    // 🔐 AUTH
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user",
        description:
          "Yeni kullanıcı oluşturur. Şu anda JWT üreten basit bir kayıt endpoint’i.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Aykut" },
                  email: { type: "string", example: "aykut@example.com" },
                  password: { type: "string", example: "12345678" },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: {
          201: { description: "User created" },
          400: { description: "Bad request" },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description:
          "Kullanıcı giriş endpoint’i. Email + password alır, JWT döner.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "aykut@example.com" },
                  password: { type: "string", example: "12345678" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          400: { description: "Invalid credentials" },
        },
      },
    },

    // 🥊 FIGHTERS (auth’suz)
    "/api/fighters": {
      get: {
        tags: ["Fighters"],
        summary: "Tüm dövüşçüleri listele (filtre destekli)",
        description:
          "Tüm dövüşçüleri listeler.\n" +
          "- weightClass: Ağırlık sınıfına göre filtreler.\n" +
          "- country: Ülke adı içinde contains-search yapar (örn: 'China').\n" +
          "- q: İsim veya lakapta full-text arama.",
        parameters: [
          {
            name: "weightClass",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Ağırlık sınıfı (örn: Lightweight).",
          },
          {
            name: "country",
            in: "query",
            required: false,
            schema: { type: "string" },
            description:
              "Ülke filtresi (örn: China, Brazil). Case-insensitive contains search.",
          },
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "İsim veya lakapta full-text arama.",
          },
        ],
        responses: {
          200: {
            description: "Fighters list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Fighter" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Fighters"],
        summary: "Yeni dövüşçü oluştur (manuel)",
        description:
          "MongoDB'ye manuel olarak yeni Fighter dokümanı ekler. Octagon senkronundan bağımsızdır.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  externalId: {
                    type: "string",
                    example: "test-fighter",
                  },
                  name: { type: "string", example: "Test Fighter" },
                  weightClass: { type: "string", example: "Lightweight" },
                  country: { type: "string", example: "Brazil" },
                  wins: { type: "number", example: 10 },
                  losses: { type: "number", example: 2 },
                  draws: { type: "number", example: 0 },
                  nickname: { type: "string", example: "Terminator" },
                  status: { type: "string", example: "Active" },
                  imageUrl: {
                    type: "string",
                    example: "https://example.com/test.png",
                  },
                },
                required: ["externalId", "name", "weightClass"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Fighter created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Fighter" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // 🔁 Octagon senkron
    "/api/fighters/sync": {
      post: {
        tags: ["Fighters"],
        summary: "Octagon'dan tüm dövüşçüleri senkronize et",
        description:
          "Ücretsiz Octagon API'den fighter verilerini çekip MongoDB'deki fighters koleksiyonuna yazar (upsert – varsa günceller, yoksa ekler).",
        responses: {
          200: {
            description: "Senkron başarılı",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Sync completed" },
                    count: { type: "number", example: 350 },
                  },
                },
              },
            },
          },
          500: { description: "Sync failed" },
        },
      },
    },

    // ❌ SLUG endpoint
    "/api/fighters/{externalId}": {
      get: {
        tags: ["Fighters"],
        summary: "Slug (externalId) ile tek dövüşçü getir",
        description:
          "Octagon slug (externalId) ile tek bir dövüşçüyü getirir.\nÖr: /api/fighters/alex-pereira",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Fighter externalId (slug) – örn: alex-pereira",
          },
        ],
        responses: {
          200: {
            description: "Fighter detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Fighter" },
                  },
                },
              },
            },
          },
          404: { description: "Fighter not found" },
        },
      },
      put: {
        tags: ["Fighters"],
        summary: "Dövüşçüyü güncelle (tam) – externalId ile",
        description: "Full update fighter by externalId (slug). Tüm alanları override eder.",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Fighter" },
            },
          },
        },
        responses: {
          200: { description: "Fighter updated" },
          404: { description: "Fighter not found" },
        },
      },
      patch: {
        tags: ["Fighters"],
        summary: "Dövüşçüyü kısmi güncelle (partial) – externalId ile",
        description:
          "Partial update fighter by externalId. Sadece gönderilen alanlar güncellenir.",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description:
                  'Gönderdiğin alanlar kısmi olarak güncellenir (ör: { "wins": 23 })',
              },
            },
          },
        },
        responses: {
          200: { description: "Fighter patched" },
          404: { description: "Fighter not found" },
        },
      },
      delete: {
        tags: ["Fighters"],
        summary: "Dövüşçüyü sil – externalId ile",
        description: "Delete fighter by externalId (slug).",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Fighter deleted" },
          404: { description: "Fighter not found" },
        },
      },
    },

    // ⭐ FAVORITES (tamamı auth korumalı)
    "/api/favorites": {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ["Favorites"],
        summary: "Kullanıcının tüm favorilerini listele",
        description:
          "JWT ile authenticate olan kullanıcının tüm favori dövüşçülerini, fighter populate edilmiş şekilde döner.",
        responses: {
          200: {
            description: "Favorites list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Favorite" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ["Favorites"],
        summary: "Yeni favori ekle",
        description:
          "Authenticate kullanıcı için yeni bir favorite kaydı oluşturur. Fighter'ı externalId (slug) üzerinden bulur.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fighterExternalId: {
                    type: "string",
                    example: "alex-pereira",
                    description: "Fighter externalId (slug)",
                  },
                  note: {
                    type: "string",
                    example: "Goat",
                    description: "İsteğe bağlı kullanıcı notu",
                  },
                },
                required: ["fighterExternalId"],
              },
            },
          },
        },
        responses: {
          201: { description: "Favorite created" },
          400: { description: "Bad request / already favorited" },
          404: { description: "Fighter not found" },
        },
      },
    },

    "/api/favorites/{externalId}": {
      put: {
        security: [{ bearerAuth: [] }],
        tags: ["Favorites"],
        summary: "Favori notunu güncelle (full)",
        description:
          "Favorite kaydını, externalId üzerinden bulup not alanını full update yapar.\n" +
          "externalId normalde Fighter.externalId (slug) olmalı; geriye dönük uyumluluk için Favorite._id veya Fighter._id de desteklenir.",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description:
              "Tercihen Fighter.externalId (slug). Fallback: Favorite._id veya Fighter._id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  note: { type: "string", example: "Best Fighter" },
                },
                required: ["note"],
              },
            },
          },
        },
        responses: {
          200: { description: "Favorite updated" },
          404: { description: "Favorite not found" },
        },
      },
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ["Favorites"],
        summary: "Favori notunu kısmi güncelle",
        description:
          "Favorite kaydının sadece note alanını kısmi güncellemek için kullanılır.",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description:
              "Tercihen Fighter.externalId (slug). Fallback: Favorite._id veya Fighter._id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  note: { type: "string", example: "Yeni not" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Favorite patched" },
          404: { description: "Favorite not found" },
        },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ["Favorites"],
        summary: "Favoriyi sil",
        description:
          "Favorite kaydını siler. externalId normalde Fighter.externalId (slug) olmalı; geriye dönük uyumluluk için Favorite._id veya Fighter._id de desteklenir.",
        parameters: [
          {
            name: "externalId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description:
              "Tercihen Fighter.externalId (slug). Fallback: Favorite._id veya Fighter._id",
          },
        ],
        responses: {
          200: { description: "Favorite deleted" },
          404: { description: "Favorite not found" },
        },
      },
    },

    // 🟡 UFC EVENTS – event header listeleri
    "/api/ufc/events/refresh": {
      post: {
        tags: ["UFC Events"],
        summary: "UFC websitesinden event listelerini (upcoming + past) yenile",
        description:
          "UFC'nin event listesi sayfalarından upcoming ve past event header bilgilerini (ufcId, name, date, location, isUpcoming vb.) çekip MongoDB'ye upsert eder.\n" +
          "Bu endpoint sadece event başlıklarını günceller, fights[] detaylarına dokunmaz.",
        responses: {
          200: {
            description: "Refresh completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "UFC events refreshed",
                    },
                    data: {
                      type: "object",
                      properties: {
                        upcomingCount: { type: "number", example: 4 },
                        pastCount: { type: "number", example: 20 },
                        total: { type: "number", example: 24 },
                      },
                    },
                  },
                },
              },
            },
          },
          500: { description: "UFC events refresh failed" },
        },
      },
    },

    "/api/ufc/events/upcoming": {
      get: {
        tags: ["UFC Events"],
        summary: "Upcoming UFC eventlerini getir",
        description:
          "MongoDB'de isUpcoming=true olan tüm UFC eventlerini, fights[] alanı olmadan (sadece header) listeler.",
        responses: {
          200: {
            description: "Upcoming events list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UfcEvent" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Upcoming events load failed" },
        },
      },
    },

    "/api/ufc/events/past": {
      get: {
        tags: ["UFC Events"],
        summary: "Past UFC eventlerini getir",
        description:
          "MongoDB'de isUpcoming=false olan geçmiş UFC eventlerini listeler (implementasyona göre son N adet olabilir).",
        responses: {
          200: {
            description: "Past events list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UfcEvent" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Past events load failed" },
        },
      },
    },

    // 🆕 Tek event detail (fights dahil)
    "/api/ufc/events/{ufcId}": {
      get: {
        tags: ["UFC Events"],
        summary: "Tek bir UFC event + fights detaylarını getir",
        description:
          "Belirli bir UFC event'in header + fights[] detaylarını MongoDB'den döner. fights[] alanı daha önce /refresh-details veya bulk refresh endpoint'leri ile doldurulmuş olmalıdır.",
        parameters: [
          {
            name: "ufcId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description:
              "UFC event slug/id (örn: ufc-312 veya ufc-fight-night-december-13-2025)",
            example: "ufc-fight-night-december-13-2025",
          },
        ],
        responses: {
          200: {
            description: "Event detail with fights",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      $ref: "#/components/schemas/EventWithFights",
                    },
                  },
                },
              },
            },
          },
          404: { description: "Event not found" },
          500: { description: "Event details load failed" },
        },
      },
    },

    // 🆕 Tek event detaylarını UFC sitesinden scrape edip DB'ye yazan endpoint
    "/api/ufc/events/{ufcId}/refresh-details": {
      post: {
        tags: ["UFC Events"],
        summary: "Tek bir UFC event için fight card detaylarını scrape et",
        description:
          "Verilen ufcId için UFC event detail sayfasını ziyaret eder, fight card'ı (tüm fights[]) scrape eder ve MongoDB'deki ilgili UfcEvent dokümanına yazar. Sonrasında güncel dokümanı döner.\n" +
          "- Upcoming eventlerde: fightBonus/result* genelde boş olur.\n" +
          "- Past eventlerde: winnerSide, resultMethod, resultRound, fightBonus alanları UFC sayfasından doldurulur.",
        parameters: [
          {
            name: "ufcId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "UFC event slug/id (örn: ufc-312)",
            example: "ufc-312",
          },
        ],
        responses: {
          200: {
            description: "Details refreshed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      $ref: "#/components/schemas/EventWithFights",
                    },
                  },
                },
              },
            },
          },
          404: { description: "Event not found in DB" },
          502: { description: "Scrape failed (UFC blocked / DOM changed)" },
        },
      },
    },

    // 🆕 BULK REFRESH – SADECE UPCOMING EVENTLERİN DETAYLARINI GÜNCELLE
    "/api/ufc/events/refresh-all": {
      post: {
        tags: ["UFC Events"],
        summary:
          "Tüm event detaylarını güncelle.",
        description:
          "MongoDB'de isUpcoming=true olan TÜM upcoming UFC eventleri için UFC detail sayfasını scrape eder ve fights[] bilgisini günceller.\n" +
          "Past event'lere dokunmaz. Frontend'deki 'Refresh Upcoming Details' butonu buna basmalıdır.",
        responses: {
          200: {
            description: "Tüm event detayları başarıyla güncellendi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalEvents: {
                          type: "number",
                          example: 4,
                          description:
                            "İşlem yapılmaya çalışılan upcoming event sayısı",
                        },
                        updatedCount: {
                          type: "number",
                          example: 4,
                          description:
                            "Detayları başarıyla güncellenen upcoming event sayısı",
                        },
                        failedCount: {
                          type: "number",
                          example: 0,
                          description: "Scrape sırasında hata alan event sayısı",
                        },
                        errors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              ufcId: {
                                type: "string",
                                example: "ufc-312",
                              },
                              error: {
                                type: "string",
                                example: "Scrape failed (DOM changed)",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          502: {
            description: "UFC upcoming events bulk refresh failed",
          },
        },
      },
    },

    // 🆕 BULK REFRESH – SADECE PAST EVENTLERİN DETAYLARINI GÜNCELLE
    "/api/ufc/events/refresh-past": {
      post: {
        tags: ["UFC Events"],
        summary:
          "Geçmiş event detaylarını güncelle.",
        description:
          "MongoDB'de isUpcoming=false olan TÜM geçmiş UFC eventleri için UFC detail sayfasını scrape eder ve fights[] bilgisini günceller.\n" +
          "Bu endpoint özellikle fightBonus / winnerSide / resultMethod / resultRound gibi geçmiş maç istatistiklerini doldurmak için kullanılır.",
        responses: {
          200: {
            description: "Geçmiş event detayları başarıyla güncellendi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalEvents: {
                          type: "number",
                          example: 8,
                          description: "İşlem yapılmaya çalışılan past event sayısı",
                        },
                        updatedCount: {
                          type: "number",
                          example: 7,
                          description:
                            "Detayları başarıyla güncellenen past event sayısı",
                        },
                        failedCount: {
                          type: "number",
                          example: 1,
                          description: "Scrape sırasında hata alan event sayısı",
                        },
                        errors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              ufcId: {
                                type: "string",
                                example: "ufc-311",
                              },
                              error: {
                                type: "string",
                                example: "Scrape failed (DOM changed)",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          502: {
            description: "Geçmiş event detaylarını güncelleme başarısız oldu",
          },
        },
      },
    },

    // 🥋 UFC Rankings endpoints
    "/api/ufc/rankings": {
      get: {
        tags: ["Rankings"],
        summary: "Get all UFC rankings from database",
        description:
          "MongoDB'den tüm sikletler için rankings bilgisini döner. Scraping yapmaz, sadece DB'den okur.",
        responses: {
          200: {
            description: "Rankings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    source: {
                      type: "string",
                      example: "https://www.ufc.com/rankings",
                    },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                      description: "Son güncelleme zamanı",
                    },
                    divisions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Division" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Failed to get rankings" },
        },
      },
    },

    "/api/ufc/rankings/refresh": {
      post: {
        tags: ["Rankings"],
        summary: "Refresh UFC rankings from web",
        description:
          "UFC web sitesinden rankings'i scrape eder ve MongoDB'ye kaydeder. Manuel olarak Swagger API üzerinden çağrılmalıdır.",
        responses: {
          200: {
            description: "Rankings refreshed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "UFC rankings refreshed from web",
                    },
                    data: {
                      type: "object",
                      properties: {
                        divisions: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Division" },
                        },
                        updatedAt: {
                          type: "string",
                          format: "date-time",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Failed to refresh rankings" },
        },
      },
    },

    "/api/ufc/rankings/{divisionName}": {
      get: {
        tags: ["Rankings"],
        summary: "Get single division rankings from database",
        description:
          "MongoDB'den belirli bir siklet için rankings bilgisini döner. Scraping yapmaz, sadece DB'den okur.",
        parameters: [
          {
            in: "path",
            name: "divisionName",
            required: true,
            schema: { type: "string" },
            description: "Siklet adı (örn: 'lightweight', 'welterweight')",
            example: "lightweight",
          },
        ],
        responses: {
          200: {
            description: "Division rankings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    source: {
                      type: "string",
                      example: "https://www.ufc.com/rankings",
                    },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                      description: "Son güncelleme zamanı",
                    },
                    division: { $ref: "#/components/schemas/Division" },
                  },
                },
              },
            },
          },
          404: { description: "Division not found" },
          500: { description: "Failed to get division rankings" },
        },
      },
    },
  },
};