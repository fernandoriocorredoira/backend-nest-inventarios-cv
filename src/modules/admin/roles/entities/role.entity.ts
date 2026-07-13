import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "../../permissions/entities/permission.entity";

@Entity('roles')
export class Role {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    name!: string;

    @Column({nullable: true})
    descripcion?: string;

    @ManyToMany(() => Permission, (permiso) => permiso.roles, {eager: true})
    @JoinTable({
        name: 'role_permissions',
        joinColumn: {
            name: 'role_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'permission_id',
            referencedColumnName: 'id'
        }
    })
    permissions?: Permission[];

}
