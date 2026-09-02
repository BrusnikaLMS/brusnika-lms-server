
echo "Downloading H5P core"
echo "Downloading H5P editor"

# Создание директории и субдиректорий для h5p
base="$(dirname $0)/h5p"
mkdir -p "$base/tmp"
mkdir -p "$base/tmp/core"
mkdir -p "$base/tmp/editor"
mkdir -p "$base/core"
mkdir -p "$base/editor"
mkdir -p "$base/libraries"

# Удаление существующих директорий с ядром и временными файлами
rm -rf "$base/tmp"/*
rm -rf "$base/core"/*
rm -rf "$base/editor"/*

# Ссылки на актуальное ядро и редактор для загрузки
core=https://github.com/h5p/h5p-php-library/archive/refs/heads/master.zip
editor=https://github.com/h5p/h5p-editor-php-library/archive/refs/heads/master.zip

# Установка и распаковка ядра и редактора в h5p/editor и h5p/core. 
curl -L $core -o"$base/tmp/core.zip"
unzip -a "$base/tmp/core.zip" -d"$base/tmp/core"
curl -L $editor -o"$base/tmp/editor.zip"
unzip -a "$base/tmp/editor.zip" -d"$base/tmp/editor"
mv "$base/tmp/core/h5p-php-library-master"/* "$base/core/"
mv "$base/tmp/editor/h5p-editor-php-library-master"/* "$base/editor/"

# Замена стилей для редактора - используем полную версию CSS с иконками
echo "  replacing: ./static/h5p-editor-application.css:$base/editor/styles/css/application.css"
cp "$(dirname $0)/static/h5p-editor-application.css" "$base/editor/styles/css/application.css"

echo "  adding: ./static/fonts/h5p-core-30.woff2:$base/editor/styles/css/application.css"
cp "$(dirname $0)/static/fonts/h5p-core-30.woff2" "$base/editor/styles/css/fonts/"

rm -rf "$base/tmp"