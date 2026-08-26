Установка лицензии Brusnika LMS
================================

1. Поместите файлы лицензии в папку putlicense/:
   - putlicense/license.enc
   - putlicense/public.key

2. Запустите скрипт из этой папки:
   bash install_license.sh

Скрипт автоматически найдёт PHP-контейнер LMS и скопирует
файлы по пути /local/license/ внутри контейнера.


Brusnika LMS license installation
==================================

1. Place the license files into the putlicense/ folder:
   - putlicense/license.enc
   - putlicense/public.key

2. Run the script from this folder:
   bash install_license.sh

The script automatically finds the LMS PHP container and copies
the files to /local/license/ inside it.
