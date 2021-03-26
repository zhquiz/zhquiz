<template>
  <main class="HomePage">
    <b-loading v-if="!isReady" active is-full-page></b-loading>
    <form v-else class="card login-card" @submit.prevent="login">
      <div class="card-content">
        <h2 class="title is-4">
          Login with email
          <b-tooltip
            type="is-dark"
            label="A magic link will be set to your mailbox"
          >
            <b-icon size="is-small" icon="info-circle"></b-icon>
          </b-tooltip>
        </h2>

        <b-field>
          <b-input
            v-model="email"
            type="email"
            name="email"
            placeholder="Email"
          ></b-input>
        </b-field>

        <b-button class="is-primary is-fullwidth" @click="login">
          Login
        </b-button>
      </div>
    </form>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { Magic } from 'magic-sdk'

@Component<HomePage>({
  async mounted() {
    await this.$accessor.setCredentials()

    if (this.$accessor.isApp) {
      this.$router.replace('/app')
    } else {
      if (process.env.MAGIC_PUBLIC) {
        this.magic = new Magic(process.env.MAGIC_PUBLIC)
      }

      this.isReady = true
    }
  },
})
export default class HomePage extends Vue {
  magic: Magic | null = null
  email = ''

  isReady = false

  async login() {
    if (this.magic) {
      this.magic.auth
        .loginWithMagicLink({ email: this.email })
        .then((token) => {
          console.log(token)

          if (!token) {
            throw new Error()
          }

          this.$axios.defaults.headers.Authorization = `Bearer ${token}`
          this.$router.push('/app')
        })
        .catch(() => {
          delete this.$axios.defaults.headers.Authorization
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.HomePage {
  background-color: rgba(211, 211, 211, 0.3);
  width: 100%;
  height: 100%;
}

.login-card {
  position: absolute;
  max-width: 500px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  overflow: visible;
}
</style>
