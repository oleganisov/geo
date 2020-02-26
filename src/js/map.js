import renderBalloon from '../templates/balloon.hbs';
/* global ymaps  */

function mapInit() {
    ymaps.ready(async () => {
        const map = await new ymaps.Map('map-container', {
            center: [55.1, 36.6],
            zoom: 12,
            controls: ['zoomControl'],
            behaviors: ['drag']
        });
        // Создание кластера.
        const clusterer = await new ymaps.Clusterer({
            clusterDisableClickZoom: true
        });
        // создание макета балуна
        // const balloonLayoutClass = ymaps.templateLayoutFactory.createClass(
        //     '<h3>$[properties.name]</h3>' +
        //         '<p>Описание: $[properties.description]</p>' +
        //         '<p>Население: $[properties.population|неизвестно]</p>' +
        //         '<p>Метрополитен: </p>'
        // );
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            renderBalloon({
                feedbackAddress: 'Караганда',
                feedbackList: [
                    { name: 'User1', comment: 'Test' },
                    { name: 'User2', comment: 'Test2' }
                ]
            })
        );

        // Создание метки.
        const createPlacemark = async (
            coords
            // hintContent = 'поиск...',
            // balloonContent = 'Content',
            // balloonContentHeader = 'Header'
        ) => {
            const newPlacemark = await new ymaps.Placemark(
                coords,
                {
                    // hintContent: hintContent,
                    // balloonContent: balloonContent,
                    // balloonContentHeader: balloonContentHeader,
                    // balloonContentLayout: balloonContentLayout
                },
                {
                    iconLayout: 'default#image',
                    iconImageHref: '../assets/img/baloon_active.png',
                    iconImageSize: [44, 66],
                    iconImageOffset: [-22, -33],
                    balloonContentLayout: balloonContentLayout
                }
            );

            clusterer.add(newPlacemark);

            return newPlacemark;
        };
        // Получение адреса.
        const getAddress = async coords => {
            const geocode = await ymaps.geocode(coords);
            const firstObject = await geocode.geoObjects.get(0);
            const address = await firstObject.getAddressLine();

            return address;
        };

        map.events.add('click', async e => {
            const coords = await e.get('coords');
            const address = await getAddress(coords);
            // const balloonContent = `<div><div class="balloon__header">${address}</div><input type="text" placeholder="Ваше имя"></input></div>`;

            if (!map.balloon.isOpen()) {
                map.balloon.open(
                    coords,
                    {
                        balloonHeader: 'Headr',
                        balloonContent: 'Hello Yandex!'
                    },
                    { balloonContentLayout: balloonContentLayout }
                );
            }

            createPlacemark(coords, address, '', address);
            map.geoObjects.add(clusterer);
        });
    });
}

export { mapInit };
