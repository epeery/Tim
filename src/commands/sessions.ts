import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import * as dateFormat from 'dateformat'
import {existsSync, readJSON} from 'fs-extra'

import {autocompleteProject} from '../autocomplete-project'
import {getDayFile} from '../get-day-file'
import {getProjectFile} from '../get-project-file'

export default class Sessions extends Command {
  static description = "list today's sessions"

  static flags = {
    help: flags.help({char: 'h'}),
    all: flags.boolean({char: 'a', description: 'display sessions for all projects'})
  }

  static args = [{name: 'project'}]

  async run() {
    const {args, flags} = this.parse(Sessions)
    let project = args.project
    const projectFile = await getProjectFile(this.config.configDir, project)

    const now = new Date()
    const dayFile = await getDayFile(this.config.configDir, now)
    const day = await readJSON(dayFile)

    if (!flags.all) {
      if (!project || !existsSync(projectFile)) {
        project = await autocompleteProject(
          this.config.configDir,
          () => this.error('You have no projects\nAdd one using: tim add')
        )
      }

      const filteredSessions = day.sessions.filter(({name}: {name: string}) => name === project)
      if (filteredSessions.length > 0) {
        printSessions(filteredSessions)
      } else {
        this.log(`You haven't logged any sessions for: "${project}" today`)
      }
    } else {
      printSessions(day.sessions)
    }
  }
}

function printSessions(sessions: Array<object>) {
  cli.table(sessions, {
    start: {
      get: (row: any) => dateFormat(row.start, 'HH:mm')
    },
    end: {
      get: (row: any) => dateFormat(row.end, 'HH:mm')
    },
    name: {
    },
    note: {
      get: (row: any) => row.notes[0] || ''
    }
  })
}
