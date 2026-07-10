# Huong dan dien anh san pham

File can sua:

`data/products.json`

Moi san pham nen co 1 anh chinh va 3 anh phu theo format:

```json
{
  "image_url": "LINK_ANH_CHINH",
  "source_image_url": "LINK_ANH_CHINH",
  "gallery": [
    "LINK_ANH_CHINH",
    "LINK_ANH_PHU_1",
    "LINK_ANH_PHU_2",
    "LINK_ANH_PHU_3"
  ]
}
```

Quy uoc:

- `image_url`: anh chinh, dung cho catalog, cart, search va anh dau tien o trang chi tiet.
- `source_image_url`: giu giong `image_url` neu ban tu dien data.
- `gallery[0]`: nen trung voi `image_url`.
- `gallery[1]`, `gallery[2]`, `gallery[3]`: ba anh phu.
- Neu chi co 2 hoac 3 anh, trang chi tiet van hien binh thuong.

Vi du:

```json
{
  "id": "p-0001",
  "name": "Cai ngong 400gr",
  "image_url": "https://example.com/cai-ngong-main.jpg",
  "source_image_url": "https://example.com/cai-ngong-main.jpg",
  "gallery": [
    "https://example.com/cai-ngong-main.jpg",
    "https://example.com/cai-ngong-1.jpg",
    "https://example.com/cai-ngong-2.jpg",
    "https://example.com/cai-ngong-3.jpg"
  ]
}
```
