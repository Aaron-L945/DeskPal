from PIL import Image
import os
import argparse
import yaml

def load_config():
    """从config.yaml加载配置"""
    config_path = 'config.yaml'
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    return {}

def extract_frames_final(
    image_path,
    frames_per_row,
    slice_width=192,
    output_dir="frames"
):
    """
    完整流程：
    1. 按行切多行
    2. 每一行按指定宽度竖切
    3. 保存最终帧
    """

    try:
        img = Image.open(image_path)
    except FileNotFoundError:
        print(f"❌ 找不到文件: {image_path}")
        return

    width, height = img.size
    print(f"✅ 图片尺寸: {width}x{height}")
    print(f"📐 每帧宽度: {slice_width}px")
    print(f"📊 每行应切片数: {frames_per_row}")
    print(f"📂 输出目录: {output_dir}")

    os.makedirs(output_dir, exist_ok=True)

    num_rows = len(frames_per_row)
    row_height = height // num_rows

    frame_id = 0

    for row_idx, expected_slices in enumerate(frames_per_row):
        y1 = row_idx * row_height
        y2 = (row_idx + 1) * row_height if row_idx < num_rows - 1 else height

        row_img = img.crop((0, y1, width, y2))

        # 按指定宽度竖切
        for col_idx in range(expected_slices):
            x1 = col_idx * slice_width
            x2 = x1 + slice_width

            if x2 > width:
                print(f"⚠️ 跳过越界切片: 行{row_idx+1} 列{col_idx+1}")
                break

            frame = row_img.crop((x1, 0, x2, row_height))

            out_name = f"frame_{frame_id:04d}.png"
            out_path = os.path.join(output_dir, out_name)
            frame.save(
                out_path,
                format="PNG",
                resample=Image.NEAREST
            )

            print(f"💾 保存: {out_path} (行{row_idx+1}, 列{col_idx+1})")

            frame_id += 1

    print(f"\n🎉 完成！共生成 {frame_id} 个最终帧")

# =================== 执行 ===================
if __name__ == "__main__":
    # 加载配置文件
    config = load_config()
    export_config = config.get('export', {})
    
    parser = argparse.ArgumentParser(description='从雪碧图导出帧动画')
    parser.add_argument('--image-path', '-i', type=str, 
                        default=export_config.get('image_path', 'ikun-hoops/spritesheet.webp'),
                        help='源图片路径')
    parser.add_argument('--frames-per-row', '-r', type=str, 
                        default=','.join(map(str, export_config.get('frame_groups', []))),
                        help='每行帧数，逗号分隔，如: 6,8,8,4,5')
    parser.add_argument('--slice-width', '-w', type=int, 
                        default=export_config.get('slice_width', 192),
                        help='每帧宽度（像素），默认192')
    parser.add_argument('--output', '-o', type=str, 
                        default=export_config.get('output', 'frames'),
                        help='输出目录，默认frames')
    parser.add_argument('--use-config', '-c', action='store_true',
                        help='强制使用配置文件中的值，忽略命令行参数')
    
    args = parser.parse_args()
    
    # 解析每行帧数
    frames_str = args.frames_per_row.strip()
    if not frames_str:
        print("❌ 错误: frames_per_row 不能为空")
        exit(1)
    
    frames_per_row = [int(x.strip()) for x in frames_str.split(',')]
    
    # 从配置读取的默认值会覆盖命令行默认值
    # 如果命令行显式提供了值，则使用命令行的值
    image_path = args.image_path
    slice_width = args.slice_width
    output_dir = args.output
    
    extract_frames_final(
        image_path=image_path,
        frames_per_row=frames_per_row,
        slice_width=slice_width,
        output_dir=output_dir
    )