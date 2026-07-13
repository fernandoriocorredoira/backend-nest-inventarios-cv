import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../roles/entities/role.entity";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'varchar', length: 50})
    name!: string;

    @Column({unique: true })
    email!: string;

    @Column()
    password!: string

    @Column({default: true})
    status!:  boolean

    @ManyToMany(() => Role, {eager: true})
    @JoinTable({
        name: 'users_roles',
        joinColumn: {name: 'user_id'},
        inverseJoinColumn: {name: 'role_id'}
    })
    roles?: Role[];

}
