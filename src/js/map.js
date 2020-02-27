import renderBalloon from '../templates/balloon.hbs';
/* global ymaps  */

function mapInit() {
    ymaps.ready(async () => {
        const map = await new ymaps.Map('map-container', {
            center: [55.1, 36.6],
            zoom: 15,
            controls: ['zoomControl'],
            behaviors: ['drag']
        });
        // создание макета балуна кластера
        const clusterBalloonItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
                '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
                '<div class=ballon_footer>{{ properties.custom|raw }}</div>'
        );
        // создание макета балуна метки
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            renderBalloon({
                balloonAddress: '{{properties.address}}',
                balloonList:
                    '{% if properties.feedback.length %}' +
                    '{% for feed in properties.feedback %}' +
                    '<div class="feedback__item"><div>' +
                    '<span class="feedback__author">{{feed.name}} </span>' +
                    '<span class="feedback__place">{{feed.place}} </span>' +
                    '<span class="feedback__date">{{feed.date}}</span></div>' +
                    '<div class="feedback__comment">{{feed.comment}}</div></div>' +
                    '{% endfor %}' +
                    '{% else %}' +
                    '<div class="feedback__empty"> Отзывов пока нет... </div>' +
                    '{% endif %}'
            }),
            {
                build() {
                    this.constructor.superclass.build.call(this);
                    const btnClose = document.querySelector('.feedback__close');
                    const btnSubmit = document.querySelector(
                        '.feedback__submit'
                    );

                    btnClose.addEventListener('click', this.handlerClose);
                    btnSubmit.addEventListener(
                        'click',
                        this.handlerSubmit.bind(this)
                    );
                },
                handlerClose() {
                    map.balloon.close();
                },
                handlerSubmit(e) {
                    e.preventDefault();
                    const feedback = {};
                    const arrFeedback = this.getData(
                        'geoObject'
                    ).properties.get('feedback')
                        ? this.getData('geoObject').properties.get('feedback')
                        : [];
                    const form = document.querySelector('.feedback__form');

                    if (
                        form.name.value &&
                        form.place.value &&
                        form.comment.value
                    ) {
                        feedback.name = form.name.value;
                        feedback.place = form.place.value;
                        feedback.comment = form.comment.value;
                        feedback.date = new Date().toLocaleDateString('ru-RU');
                        arrFeedback.push(feedback);
                        this.getData('geoObject').properties.set(
                            'feedback',
                            arrFeedback
                        );
                    } else {
                        alert('Не заполнены поля');
                    }
                }
            }
        );
        // Создание кластера.
        const clusterer = await new ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            clusterBalloonItemContentLayout: clusterBalloonItemContentLayout,
            clusterBalloonCycling: false,
            clusterBalloonPagerType: 'marker',
            hideIconOnBalloonOpen: false,
            clusterIcons: [
                {
                    href: '../assets/img/baloon_notactive.png',
                    size: [44, 66],
                    offset: [-22, -33]
                }
            ],
            clusterNumbers: [100]
        });

        // Создание метки.
        async function createPlacemark(coords, address = '', hintContent = '') {
            const newPlacemark = await new ymaps.Placemark(
                coords,
                {
                    address,
                    hintContent,
                    balloonContentHeader: address + 'header',
                    balloonContentBody: address + 'body',
                    balloonContentFooter: address + 'footer',
                    custom: 'test'
                },
                {
                    iconLayout: 'default#image',
                    iconImageHref: '../assets/img/baloon_active.png',
                    iconImageSize: [44, 66],
                    iconImageOffset: [-22, -33],
                    balloonContentLayout: balloonContentLayout,
                    balloonCloseButton: false,
                    hideIconOnBalloonOpen: false
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

        // обработчик кликов на карте
        map.events.add('click', async e => {
            const coords = await e.get('coords');
            const address = await getAddress(coords);
            const newPlacemark = await createPlacemark(
                coords,
                address,
                address
            );

            clusterer.add(newPlacemark);

            map.geoObjects.add(clusterer);
            // открытие балуна новой метки
            if (!newPlacemark.balloon.isOpen()) {
                newPlacemark.balloon.open(coords);
            }
        });
        // map.events.add('balloonopen', e =>
        //     console.log(e.get('target'))
        // );
    });
}

export { mapInit };
