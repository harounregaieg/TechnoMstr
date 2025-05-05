import { createRouter, createWebHistory} from 'vue-router'
import Home from '../views/Home.vue'


const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path:'/',
            component: Home,
        },
        {
            path: '/equipements',
            component: () => import('../views/Equipements.vue'),
        },
        {
            path: '/users',
            component: () => import('../views/Users.vue'),
        },
        {
            path:'/tickets',
            component: () => import('../views/Tickets.vue'),
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/Login.vue')
        },
        {
            path:'/notifications',
            component: () => import('../views/Notifications.vue'),
        },
        {
            path:'/account',
            component: () => import('../views/Account.vue'),
        },
        
        {
            path:'/logout',
            redirect: '/login'
        },
        {
            path:'/ajouter-ticket',
            component: () => import('../views/AjouterTicket.vue'),
        },
        {
            path:'/ajouter-equipement',
            component: () => import('../views/AjouterEquipement.vue'),
        },
        {
            path:'/ajouter-user',
            component: () => import('../views/AjouterUser.vue'),
        },
        {
            path:'/modifier-user/:id',
            component: () => import('../views/AjouterUser.vue'),
            props: true,
        },
        {
            path:'/ticket/:id',
            name: 'TicketDetails',
            component: () => import('../views/TicketDetails.vue'),
        },
        {
            path:'/envoyer-commande',
            component: () => import('../components/EquipementComponents/SendCommand.vue'),
        },
    ]
})

export default router