import renderBalloon from '../templates/balloon.hbs';
/* global ymaps  */

let placemarks = [];
let coordinates = [];

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

        // Создание метки.
        async function createPlacemark(
            coords,
            address = '',
            hintContent = 'поиск...'
        ) {
            const newPlacemark = await new ymaps.Placemark(
                coords,
                { address: address, hintContent: hintContent },
                {
                    iconLayout: 'default#image',
                    iconImageHref: '../assets/img/baloon_active.png',
                    iconImageSize: [44, 66],
                    iconImageOffset: [-22, -33],
                    balloonContentLayout: balloonContentLayout,
                    closeButton: false
                }
            );

            return newPlacemark;
        }
        // Получение адреса.
        async function getAddress(coords) {
            const geocode = await ymaps.geocode(coords);
            const firstObject = await geocode.geoObjects.get(0);
            const address = await firstObject.getAddressLine();

            return address;
        }
        // создание макета балуна
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            renderBalloon({
                balloonAddress: '{{ properties.address }}',
                balloonList: [
                    { name: 'User1', comment: 'Test' },
                    { name: 'User2', comment: 'Test2' }
                ]
            })
        );

        map.events.add('click', async e => {
            coordinates = await e.get('coords');
            const address = await getAddress(coordinates);
            const newPlacemark = await createPlacemark(
                coordinates,
                address,
                address
            );

            clusterer.add(newPlacemark);
            placemarks.push(newPlacemark);

            map.geoObjects.add(clusterer);

            if (!newPlacemark.balloon.isOpen()) {
                newPlacemark.balloon.open(
                    coordinates,
                    {},
                    {
                        balloonContentLayout: balloonContentLayout,
                        closeButton: false
                    }
                );
            }
            console.log(newPlacemark.properties);
        });
    });
}

export { mapInit };
